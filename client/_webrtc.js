const localVideo = document.getElementById('local_video');
const remoteVideo = document.getElementById('remote_video');
const textForSendSdp = document.getElementById('text_for_send_sdp');
const textToReceiveSdp = document.getElementById('text_for_receive_sdp');
let localStream = null;
let peerConnection = null;
let negotiationneededCounter = 0;
let isOffer = false;

async function startVideo() {
    try{
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: false})
        playVideo(localVideo, localStream)
    } catch (error){
        console.log(error)
    }
}

async function playVideo(element, stream){
    element.srcObject = stream
    try {
        await element.play()
    } catch (error) {
        console.log(error)
    }
}

function connect(){
    if(!peerConnection){
        peerConnection = prepareNewConnection(true)
    }else{

    }
}

function prepareNewConnection(isOffer){
    // SkyWayが提供するSTUNサーバ
    const pc_config = {"iceServers":[{"urls":"stun:stun.webrtc.ecl.ntt.com:3478"}]}
    const peer = new RTCPeerConnection(pc_config)

    peer.ontrack = evt => {
        playVideo(remoteVideo, evt.streams[0])
    }

    peer.onicecandidate = evt => {
        if(evt.candidate){
            console.log(evt.candidate)
        }else{
            sendSdp(peer.localDescription)
        }
    }

    peer.onnegotiationneeded = async () => {
        try {
            if(isOffer){
                if(negotiationneededCounter === 0){
                    let offer = await peer.createOffer()
                    await peer.setLocalDescription(offer)
                    sendSdp(peer.localDescription)
                    negotiationneededCounter++
                }
            }
        } catch (error) {
            
        }
    }

    peer.oniceconnectionstatechange = () => {
        switch (peer.iceConnectionState) {
            case 'closed':
            case 'failed':
                if(peerConnection){
                    hangUp()
                }
                break;
            case 'disconnected':
                break;
        }
    }

    if(localStream){
        localStream.getTracks().forEach(track => peer.addTrack(track, localStream))
    }else{

    }

    return peer
}

function sendSdp(sessionDescription) {
    textForSendSdp.value = sessionDescription.sdp
    textForSendSdp.focus()
    textForSendSdp.select()
}

async function makeAnswer(){
    if(!peerConnection){
        return
    }
    try {
        let answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)
        sendSdp(peerConnection.localDescription)
    } catch (error) {
        
    }
}

function onSdpText(){
    const text = textToReceiveSdp.value
    if(peerConnection){
        const answer = new RTCSessionDescription({
            type: 'answer',
            sdp: text
        })
        setAnswer(answer)
    }else{
        const offer = new RTCSessionDescription({
            type: 'offer',
            sdp: text
        })
        setOffer(offer)
    }
    textToReceiveSdp.value = ''
}

async function setOffer(sessionDescription){
    if(peerConnection){

    }
    peerConnection = prepareNewConnection(false)
    try {
        await peerConnection.setRemoteDescription(sessionDescription)
        makeAnswer()
    } catch (error) {
        
    }
}

async function setAnswer(sessionDescription){
    if(!peerConnection){
        return
    }
    try {
        await peerConnection.setRemoteDescription(sessionDescription)
    } catch (error) {
        
    }
}

function hangUp(){
    if(peerConnection){
        if(peerConnection.iceConnectionState !== 'closed'){
            peerConnection.close()
            peerConnection = null
            negotiationneededCounter = 0
            cleanupVideoElement(remoteVideo)
            textForSendSdp.value = ''
            return
        }
    }
}

function cleanupVideoElement(element){
    element.pause()
    element.srcObject = null
}