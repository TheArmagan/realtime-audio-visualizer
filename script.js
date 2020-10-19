const mainAudioElement = document.querySelector("audio");

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const audioContext = new AudioContext();

const fftBufferSize = 1024;

const audioSource = audioContext.createMediaElementSource(mainAudioElement);
const audioProcessor = audioContext.createScriptProcessor(null, 2, 2);

audioProcessor.addEventListener("audioprocess", processAudio);

audioSource.connect(audioProcessor);
audioProcessor.connect(audioContext.destination);

let fftL = new FFT(fftBufferSize, 1, true);
let fftR = new FFT(fftBufferSize, 1, true);

let renderAudio = true;
/**
 * @param {AudioProcessingEvent} e 
 */
function processAudio(e) {
    let inputArrayL = e.inputBuffer.getChannelData(0);
    let inputArrayR = e.inputBuffer.getChannelData(1);
    let outputArrayL = e.outputBuffer.getChannelData(0);
    let outputArrayR = e.outputBuffer.getChannelData(1);
    let dataL = [];
    let dataR = [];
    for (let i = 0; i < inputArrayL.length; ++i) {
        outputArrayL[i] = inputArrayL[i];
        outputArrayR[i] = inputArrayR[i];
        if (renderAudio && i < fftBufferSize) {
            dataL[i] = inputArrayL[i];
            dataR[i] = inputArrayR[i];
        }
    }

    if (renderAudio) {
        fftL.forward(dataL.slice(0, fftBufferSize));
        fftR.forward(dataR.slice(0, fftBufferSize));
    }
}

let visBarL = document.querySelectorAll(".visBarL");
let visBarR = document.querySelectorAll(".visBarR");
let dataContainer = document.querySelector("#dataContainer");

function sum(arr=[]){return arr.reduce((all,current)=>all+current,0)};

function visualize() {

    fftL.calculateSpectrum();
    fftR.calculateSpectrum();

    let bassVal = (sum(fftL.spectrum.slice(1,3))+sum(fftR.spectrum.slice(1,3)))/3;

    let centeredL = [];

    for (let i = 0; i < visBarL.length/2; i++) {
        centeredL[(visBarL.length/2)-i-1] = fftL.spectrum[i];
        centeredL[(visBarL.length/2)+i] = fftL.spectrum[i];
    }

    for (let index = 0; index < visBarL.length; index++) {
        const element = visBarL[index];
        let val = centeredL[index]*((((4)/4)*100)+500);
        element.setAttribute("style", `height:${val}px;background-color:hsla(${(Date.now()/10 % 360)+index},50%,50%,${Math.max(bassVal+(val/300),0)});`)
    }

    centeredL = null;
    delete centeredL;

    let centeredR = [];

    for (let i = 0; i < visBarR.length/2; i++) {
        centeredR[(visBarR.length/2)-i-1] = fftR.spectrum[i];
        centeredR[(visBarR.length/2)+i] = fftR.spectrum[i];
    }

    for (let index = 0; index < visBarR.length; index++) {
        const element = visBarR[index];
        let val = centeredR[index]*((((4)/4)*100)+500);
        element.setAttribute("style",`height:${val}px;background-color:hsla(${360-((Date.now()/10 % 360)+index)},50%,50%,${Math.max(bassVal+(val/300),0)})`);
    }

    centeredR = null;
    delete centeredR;

    dataContainer.style.transform = `scale(${1+bassVal/2})`;
    //document.body.style.backgroundColor = `hsl(0,0%,${16-(bassVal*60)}%)`;
    
    bassVal = null;

    if (renderAudio) {
        setTimeout(() => {
            visualize();
        }, 1000 / 30) 
    }

}

window.addEventListener("keydown",(e)=>{
    if (e.key == " ") {
        if (mainAudioElement.paused) {
            mainAudioElement.play();
        } else {
            mainAudioElement.pause(); 
        }
    }
})

document.addEventListener("mouseenter", ()=>{
    renderAudio = true;
    visualize();
})

document.addEventListener("mouseleave", ()=>{
    renderAudio = false;
    //fftL.forward(Array(fftBufferSize).fill(0));
    //fftR.forward(Array(fftBufferSize).fill(0));
    visualize();
})

