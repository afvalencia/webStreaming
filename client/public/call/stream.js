var yourVideo = document.querySelector('#yours'),
    theirVideo = document.querySelector('#theirs'),
    yourConnection, connectedUser, stream, dataChannel;

function startConnection() {
    if (hasUserMedia()) {
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then(function(my_stream){
            stream = my_stream;
            yourVideo.src = window.URL.createObjectURL(stream);
            if (hasRTCPeerConnection()) {
                setupPeerConnection(stream);
            } else {
                alert("Sorry, your browser does not support WebRTC.");
            }
        }).catch(function(error) {
            console.log(error);
        });
    } else {
        alert("Sorry, your browser doesn't allow to share the webcam, or you don't have one available");
    }
}

function setupPeerConnection(stream) {
    var configuration = {
        "iceServers": [{
            "url": "stun:stun.1.google.com:19302"
            //"url": "stun:127.0.0.1:9876"
        }]
    };
    yourConnection = new RTCPeerConnection(configuration, 
        {optional: [{RtpDataChannels: true}]});


    // Setup stream listening
    yourConnection.addStream(stream);
    yourConnection.onaddstream = function(e) {
        theirVideo.src = window.URL.createObjectURL(e.stream);
    };
    // Setup ice handling
    yourConnection.onicecandidate = function(event) {
        if (event.candidate) {
            send({
                type: "candidate",
                candidate: event.candidate
            });
        }
    };
    openDataChannel();

    /*yourConnection.ondatachannel = function(event) {
        var receiveChannel = event.channel;
        dataChannel.onmessage = function(event) {
            console.log("ondatachannel message:", event.data);
        };
    }; */
}

function hasUserMedia() {
    navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
    return !!navigator.getUserMedia;
}

function hasRTCPeerConnection() {
    window.RTCPeerConnection = window.RTCPeerConnection ||
        window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    window.RTCSessionDescription = window.RTCSessionDescription ||
        window.webkitRTCSessionDescription ||
        window.mozRTCSessionDescription;
    window.RTCIceCandidate = window.RTCIceCandidate ||
        window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
    return !!window.RTCPeerConnection;
}

//Starting a Call
function startPeerConnection(user) {
    connectedUser = user;
    // Begin the offer
    yourConnection.createOffer(function(offer) {
        send({
            type: "offer",
            offer: offer
        });
        yourConnection.setLocalDescription(offer);
    }, function(error) {
        alert("An error has occurred.");
    });
};

function onLogin(success) {
    if (success === false) {
        alert("Login unsuccessful, please try a different name.");
    } else {
        alert("Login successful. Welcome!");
        loginPage.style.display = "none";
        callPage.style.display = "block";
        // Get the plumbing ready for a call
        startConnection();
    }
};

function onOffer(offer, name) {
    connectedUser = name;
    yourConnection.setRemoteDescription(new RTCSessionDescription(offer));
    var mjs_offer = confirm("Tienes una videollamada...");
    if (mjs_offer){
        yourConnection.createAnswer(function(answer) {
            yourConnection.setLocalDescription(answer);
            send({
                type: "answer",
                answer: answer
            });
        }, function(error) {
            alert("An error has occurred");
        });
    } else {
        alert("Has rechazado la video llamada");
    }
};

function onAnswer(answer) {
    yourConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

function onCandidate(candidate) {
    yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

function onLeave() {
    yourConnection.removeStream(stream);
    connectedUser = null;
    yourConnection.close();
    yourConnection.onicecandidate = null;
    yourConnection.onaddstream = null;
    setupPeerConnection(stream);
};

function openDataChannel() {
    var dataChannelOptions = {
        reliable: true,
        //maxTransmitTime: 3000
    };

    dataChannel = yourConnection.createDataChannel("myLabel", dataChannelOptions);

    //console.log(dataChannel);
    dataChannel.onerror = function (error) {
        console.log("Data Channel Error:", error);
    };

    dataChannel.onmessage = function (event) {
        console.log("Got Data Channel Message:", event.data);
        received.innerHTML += "recv: " + event.data + "<br />";
        received.scrollTop = received.scrollHeight;
    };

    dataChannel.onopen = function () {
        //console.log("Aqui llego");
        //console.log(dataChannel);
        dataChannel.send(name + " has connected.");
    };

    dataChannel.onclose = function () {
        console.log("The Data Channel is Closed");
    };

}

/*function sendMessage(msg) {
    switch(dataChannel.readyState) {
        case "open":
            dataChannel.send(msg);
            break;
        default:
            console.log("An error has occurred Natalia");
            break;
    }
}*/
