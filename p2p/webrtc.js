/* WebRTC Demo
 * Allows two clients to connect via WebRTC with Data Channels
 * Uses Firebase as a signalling server
 * http://fosterelli.co/getting-started-with-webrtc-data-channels.html 
 */

/* == Announcement Channel Functions ==
 * The 'announcement channel' allows clients to find each other on Firebase
 * These functions are for communicating through the announcement channel
 * This is part of the signalling server mechanism
 *
 * After two clients find each other on the announcement channel, they 
 * can directly send messages to each other to negotiate a WebRTC connection
 */

// Announce our arrival to the announcement channel
var sendAnnounceChannelMessage = function() {
 
    disconnectToken = announceChannel.push({
      sharedKey : sharedKey,
      id : id
    });
    disconnectToken.onDisconnect().remove();
    console.log('Announced our sharedKey is ' + sharedKey);
    console.log('Announced our ID is ' + id);
    announceChannel.orderByKey().startAt(disconnectToken.key()).on('child_added', handleAnnounceChannelMessage);
  
};

// Handle an incoming message on the announcement channel
var handleAnnounceChannelMessage = function(snapshot) {
  var message = snapshot.val();

  


  if (message.id != id && message.sharedKey == sharedKey) {
    console.log('Discovered matching announcement from ' + message.id);
  console.log('Jag är: ' + disconnectToken.key().toString());

    /*Möjlig lösning på fleranslutningsproblemet?
    pplAnnounce.push(message.id);*/
    
    console.log('JAG försöker ansluta TILL: ' + snapshot.key() + 'Och: ' + message.id);

    initiateWebRTCState(message.id);
    connect(message.id);


    
  }
};

/* == Signal Channel Functions ==
 * The signal channels are used to delegate the WebRTC connection between 
 * two peers once they have found each other via the announcement channel.
 * 
 * This is done on Firebase as well. Once the two peers communicate the
 * necessary information to 'find' each other via WebRTC, the signalling
 * channel is no longer used and the connection becomes peer-to-peer.
 */

// Send a message to the remote client via Firebase
var sendSignalChannelMessage = function(message, remoteID) {
  message.sender = id;
  database.child('messages').child(remoteID).push(message);
};

// Handle a WebRTC offer request from a remote client
var handleOfferSignal = function(message) {
  running = true;
  console.log('handleOfferSignal av ' + message.sender);
  initiateWebRTCState(message.sender);
  startSendingCandidates(message.sender);
  peerConnection[message.sender].setRemoteDescription(new RTCSessionDescription(message));
  peerConnection[message.sender].createAnswer(function(sessionDescription) {
    console.log('Sending answer to ' + message.sender);
    peerConnection[message.sender].setLocalDescription(sessionDescription);
    sendSignalChannelMessage(sessionDescription, message.sender);
  });
};

// Handle a WebRTC answer response to our offer we gave the remote client
var handleAnswerSignal = function(message, remoteID) {
  console.log('handleAnswerSignal är från:' + remoteID);
  console.log(message);
  peerConnection[remoteID].setRemoteDescription(new RTCSessionDescription(message));
};

// Handle an ICE candidate notification from the remote client
var handleCandidateSignal = function(message, sender) {
  var candidate = new RTCIceCandidate(message);
  console.log(candidate);
  peerConnection[sender].addIceCandidate(candidate);
};

// This is the general handler for a message from our remote client
// Determine what type of message it is, and call the appropriate handler
var handleSignalChannelMessage = function(snapshot) {
  var message = snapshot.val();
  var sender = message.sender;
  var type = message.type;
  console.log('Recieved a \'' + type + '\' signal from ' + sender);
  if (type == 'offer') handleOfferSignal(message);
  else if (type == 'answer') handleAnswerSignal(message, sender);
  else if (type == 'candidate') handleCandidateSignal(message, sender);
};

/* == ICE Candidate Functions ==
 * ICE candidates are what will connect the two peers
 * Both peers must find a list of suitable candidates and exchange their list
 * We exchange this list over the signalling channel (Firebase)
 */

// Add listener functions to ICE Candidate events
var startSendingCandidates = function(remoteID) {
  peerConnection[remoteID].oniceconnectionstatechange = handleICEConnectionStateChange;
  peerConnection[remoteID].onicecandidate = handleICECandidate;
  remote=remoteID;
};

// This is how we determine when the WebRTC connection has ended
// This is most likely because the other peer left the page
var handleICEConnectionStateChange = function() {
  // if (peerConnection.iceConnectionState == 'disconnected') {
  //   console.log('Client disconnected!');
  //   sendAnnounceChannelMessage();
  // }
};

// Handle ICE Candidate events by sending them to our remote
// Send the ICE Candidates via the signal channel
var handleICECandidate = function(event) {
  var candidate = event.candidate;////////////////////////////////////I DENNA FUNKTION LIGGER PROBLEMET
  console.log(event.candidate);
  if (candidate) {
    candidate.type = 'candidate';
    /*for (var i = 0; i < pplAnnounce.length; i++) {
      console.log('Sending candidate to ' + pplAnnounce[i]);
      sendSignalChannelMessage(candidate, pplAnnounce[i]);
    };*/
    console.log('Sending candidate to ' + remote);
    sendSignalChannelMessage(candidate, remote);
  } else {
    console.log('All candidates sent');
  }
};

/* == Data Channel Functions ==
 * The WebRTC connection is established by the time these functions run
 * The hard part is over, and these are the functions we really want to use
 * 
 * The functions below relate to sending and receiving WebRTC messages over
 * the peer-to-peer data channels 
 */

// This is our receiving data channel event
// We receive this channel when our peer opens a sending channel
// We will bind to trigger a handler when an incoming message happens
var handleDataChannel = function(event) {
  event.channel.onmessage = handleDataChannelMessage;
};

// This is called on an incoming message from our peer
// You probably want to overwrite this to do something more useful!
var handleDataChannelMessage = function(event) {
 
  console.log(event);
  if (event.data === "barrelRoll") {
    setInterval(draw, 1000 / 30);
  }
  else{
    var testData = JSON.parse(event.data);
            ctx.beginPath();
            ctx.fillStyle = "#ff00ff";
            ctx.rect(testData.x, testData.y, cubeSize, cubeSize);
            ctx.closePath();
            ctx.fill();
            enemyY = testData.y;
            enemyX = testData.x;
  };
  
};

// This is called when the WebRTC sending data channel is offically 'open'
var handleDataChannelOpen = function() {
  console.log('Data channel created!');
  dataChannel[remote].send('Hej, mitt ID är:'+ id +' <br>');
  numConnections ++;
  connectedPeers.push(dataChannel[remote]);
};

// Called when the data channel has closed
var handleDataChannelClosed = function() {
  console.log('The data channel has been closed!');
};

// Function to offer to start a WebRTC connection with a peer
var connect = function(remoteID) {
  running = true;
  startSendingCandidates(remoteID);
  console.log("Kandidater sända");
  peerConnection[remoteID].createOffer(function(sessionDescription) {
    console.log('Sending offer to ' + remoteID);
    peerConnection[remoteID].setLocalDescription(sessionDescription);
    sendSignalChannelMessage(sessionDescription, remoteID);
  });
  
};

// Function to initiate the WebRTC peerconnection and dataChannel
var initiateWebRTCState = function(remoteID) {
  peerConnection[remoteID] = new webkitRTCPeerConnection(servers);
  peerConnection[remoteID].ondatachannel = handleDataChannel;
  dataChannel[remoteID] = peerConnection[remoteID].createDataChannel('myDataChannelwith ' + remoteID);
  dataChannel[remoteID].onmessage = handleDataChannelMessage;
  dataChannel[remoteID].onopen = handleDataChannelOpen;
  console.log("initiateWebRTCState kördes");
};

var id;              // Our unique ID
var sharedKey;       // Unique identifier for two clients to find each other
var numConnections = 0;
var remote;          // ID of the remote peer -- set once they send an offer
var peerConnection=[];  // This is our WebRTC connection
var dataChannel=[];     // This is our outgoing data channel within WebRTC
var running = false; // Keep track of our connection state
var disconnectToken;
var pplAnnounce = [];

var connectedPeers = [];


// Use Google's public servers for STUN
// STUN is a component of the actual WebRTC connection
var servers = {
  iceServers: [ {
    url : 'stun:stun.l.google.com:19302'
  } ]
};

// Generate this browser a unique ID 
// On Firebase peers use this unique ID to address messages to each other
// after they have found each other in the announcement channel
id = Math.random().toString().replace('.', '');

// Unique identifier for two clients to use
// They MUST share this to find each other
// Each peer waits in the announcement channel to find its matching identifier
// When it finds its matching identifier, it initiates a WebRTC offer with
// that client. This unique identifier can be pretty much anything in practice.
sharedKey = prompt("Please enter a shared identifier");

// Configure, connect, and set up Firebase
// You probably want to replace the text below with your own Firebase URL
var firebaseUrl = 'https://blistering-inferno-9772.firebaseio.com/';
var database = new Firebase(firebaseUrl);
var announceChannel = database.child('announce');
var signalChannel = database.child('messages').child(id);
if (database) {};
signalChannel.on('child_added', handleSignalChannelMessage);




  


// Send a message to the announcement channel
// If our partner is already waiting, they will send us a WebRTC offer
// over our Firebase signalling channel and we can begin delegating WebRTC
sendAnnounceChannelMessage();
