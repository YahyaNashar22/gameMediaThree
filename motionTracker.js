import {
    HandLandmarker,
    FilesetResolver
  } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0"; 
import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js'

// THREE JS

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 5;

const geometry = new THREE.BoxGeometry(1,1,1);
const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const sphereGeometry = new THREE.SphereGeometry(1.5,100,100);
const materialWireframe = new THREE.MeshBasicMaterial({wireframe:true, color: 0x00ff00});
const sphere = new THREE.Mesh(sphereGeometry, materialWireframe);
// Media Pipe API
let handLandmarker = undefined;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;

const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: runningMode,
      numHands: 1
    });
    demosSection.classList.remove("invisible");
  };
  createHandLandmarker();

const video = document.getElementById("webcam");
const canvasElement = document.getElementById(
  "output_canvas"
);
const canvasCtx = canvasElement.getContext("2d");

const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
  } else {
    console.warn("getUserMedia() is not supported by your browser");
  }

  function enableCam(event) {
    if (!handLandmarker) {
      console.log("Wait! objectDetector not loaded yet.");
      return;
    }
  
    if (webcamRunning === true) {
      webcamRunning = false;
      enableWebcamButton.innerText = "ENABLE PREDICTIONS";
    } else {
      webcamRunning = true;
      enableWebcamButton.innerText = "DISABLE PREDICTIONS";
    }
     // getUsermedia parameters.
  const constraints = {
    video: true
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

let lastVideoTime = -1;
let results = undefined;
console.log(video);

        function detectGestures(handLandmarks) {
            // Get the coordinates of thumb tip and index finger tip
            const thumbTip = handLandmarks[4];
            const indexTip = handLandmarks[8];
            const pinkyTip = handLandmarks[20];
            const ringTip = handLandmarks[16];
            const middleTip = handLandmarks[12];
            // Calculate the distance between thumb tip and index finger tip
            const distance = Math.sqrt(
                Math.pow(indexTip.x - thumbTip.x, 2) +
                Math.pow(indexTip.y - thumbTip.y, 2) +
                Math.pow(indexTip.z - thumbTip.z, 2)
            );
            const pinkyThumbDistance = Math.sqrt(
              Math.pow(pinkyTip.x - thumbTip.x, 2) +
              Math.pow(pinkyTip.y - thumbTip.y, 2) +
              Math.pow(pinkyTip.z - thumbTip.z, 2)
          );
          const ringThumbDistance = Math.sqrt(
            Math.pow(ringTip.x - thumbTip.x, 2) +
            Math.pow(ringTip.y - thumbTip.y, 2) +
            Math.pow(ringTip.z - thumbTip.z, 2)
        );
        const middleThumbDistance = Math.sqrt(
          Math.pow(middleTip.x - thumbTip.x, 2) +
          Math.pow(middleTip.y - thumbTip.y, 2) +
          Math.pow(middleTip.z - thumbTip.z, 2)
      );

            // If the distance is below a threshold, perform an action (e.g., rotate the cube)
            if (distance < 0.1) {
                cube.rotation.x += 0.01;
                cube.rotation.y += 0.01;
                sphere.rotation.x += 0.01;  
                sphere.rotation.y += 0.01;
            }
          if(pinkyThumbDistance<0.1){
            scene.remove(cube);
            scene.add(sphere)
          }
          if(ringThumbDistance<0.1){
            scene.remove(sphere);
            scene.add(cube)
          }
          if(middleThumbDistance<0.1){
            const randomColor = Math.random() * 0xffffff;
            cube.material.color.set(randomColor);
            sphere.material.color.set(randomColor);
          }

            cube.position.x = indexTip.x;
            cube.position.y = indexTip.y;
            sphere.position.x = indexTip.x;
            sphere.position.y = indexTip.y;

        }
            // Example of interacting with a click gesture
function handleGestureInteractions(results) {
    if (results.landmarks) {
        for (const landmarks of results.landmarks) {
            if (detectGestures(landmarks)) {
                // Perform action associated with the "click" gesture
                // Trigger your desired action here
            }
        }
    }
}

async function predictWebcam() {
  canvasElement.style.width = video.videoWidth;;
  canvasElement.style.height = video.videoHeight;
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;
  
  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await handLandmarker.setOptions({ runningMode: "VIDEO" });
  }
  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = handLandmarker.detectForVideo(video, startTimeMs);
  }
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 5
      });
      drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 });
      handleGestureInteractions(results);
    }
  }
  canvasCtx.restore();

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

  
/////////////////////////////////////////////////////

function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

if(WebGL.isWebGLAvailable()){
    animate();
}else{
    alert("WebGL is not supported on your browser or device !")
}