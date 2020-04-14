const localVideo = document.getElementById('local_video');
const remoteVideo = document.getElementById('remote_video');
const textForSendSdp = document.getElementById('text_for_send_sdp');
const textToReceiveSdp = document.getElementById('text_for_receive_sdp');
let localStream = null;
let peerConnection = null;
let negotiationneededCounter = 0;
let isOffer = false;

const wsUrl = 'ws://localhost:3001/'
const ws = new WebSocket(wsUrl)
ws.onopen = (evt) => {

}
ws.onerror = (err) => {
    
}
ws.onmessage = (evt) => {
    console.log(`ws.onmessage() data`, evt.data)
    const message = JSON.parse(evt.data)
    switch (message.type) {
        case 'offer':
            textToReceiveSdp.value = message.sdp
            setOffer(message)
            break;
        case 'answer':
            textToReceiveSdp.value = message.sdp
            setAnswer(message)
            break;
        case 'candidate':
            const candidate = new RTCIceCandidate(message.ice)
            addIceCandidate(candidate)
            break;
        case 'close':
            hangUp()
            break;
        default:
            break;
    }
}

function addIceCandidate(candidate){
    if(peerConnection){
        if(peerConnection){
            peerConnection.addIceCandidate(candidate)
        }else{
            return
        }
    }
}
function sendIceCandidate(candidate){
    const message = JSON.stringify({type:'candidate', ice:candidate})
    ws.send(message)
}



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
    const pc_config = {"iceServers":[{"urls":"stun:stun.webrtc.ecl.ntt.com:3478"}]}
    const peer = new RTCPeerConnection(pc_config)

    peer.ontrack = evt => {
        playVideo(remoteVideo, evt.streams[0])
    }

    peer.onicecandidate = evt => {
        if(evt.candidate){
            console.log(evt.candidate)
            sendIceCandidate(evt.candidate)
        }else{
            // sendSdp(peer.localDescription)
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
    // textForSendSdp.focus()
    // textForSendSdp.select()
    const message = JSON.stringify(sessionDescription)
    ws.send(message)
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

            const message = JSON.stringify({type: 'close'})
            ws.send(message)

            cleanupVideoElement(remoteVideo)
            textForSendSdp.value = ''
            textToReceiveSdp.value = ''
            return
        }
    }
}

function cleanupVideoElement(element){
    element.pause()
    element.srcObject = null
}