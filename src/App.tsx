import * as faceapi from 'face-api.js';
import { useEffect, useRef, useState } from 'react';
import FeatherIcon from "feather-icons-react";

function App() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [captureVideo, setCaptureVideo] = useState(false);
  const [hasCameraData, setHasCaptureData] = useState(false);
  const [isHappy, setIsHappy] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoHeight = 480;
  const videoWidth = 640;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';

      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]).then(() => setModelsLoaded(true));
    }
    loadModels();
  }, []);

  const startVideo = () => {
    setCaptureVideo(true);
    navigator.mediaDevices
      .getUserMedia({ video: { width: 300 } })
      .then(stream => {
        if (videoRef.current == null) return
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      })
      .catch(err => {
        console.error("error:", err);
      });
  }

  const handleVideoOnPlay = () => {
    const displaySize = {
      width: videoWidth,
      height: videoHeight
    }
    if (canvasRef.current && videoRef.current) {

      videoRef.current.addEventListener('loadeddata', () => {
        if (canvasRef.current && videoRef.current) {
          setHasCaptureData(true)
          const newCanvas = faceapi.createCanvasFromMedia(videoRef.current);
          canvasRef.current.innerHTML = ''; // clear existing content if needed
          canvasRef.current.appendChild(newCanvas); // ✅ append the face-api canvas

          faceapi.matchDimensions(canvasRef.current, displaySize);
        }
      });

      setInterval(async () => {
        if (canvasRef.current && videoRef.current) {

          const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();

          const isCurrentlyHappy = detections.some((face) => {
            const { expression, probability } = face.expressions.asSortedArray()[0]

            return expression === 'happy' && probability > 0.3
          })

          setIsHappy(isCurrentlyHappy)
          const resizedDetections = faceapi.resizeResults(detections, displaySize);

          canvasRef.current.getContext('2d')!.clearRect(0, 0, videoWidth, videoHeight);
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);

        }
      }, 100)
    }
  }

  const closeWebcam = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      (videoRef.current.srcObject as MediaStream)!.getTracks()[0].stop();
      setCaptureVideo(false);
      setHasCaptureData(false);
    }
  }

  return (
    <>
      <div style={{
        position: 'absolute',
        top: '1em',
        left: '50%',
        zIndex: 1,
        transform: 'translateX(-50%)'
      }}>
        {hasCameraData
          ?
          <button onClick={closeWebcam} style={{ cursor: 'pointer', backgroundColor: 'transparent', padding: '15px', border: 'none', borderRadius: '50%' }}>
            <FeatherIcon icon="eye" />
          </button>
          :
          <button style={{ cursor: 'default', backgroundColor: 'transparent', padding: '15px', border: 'none', borderRadius: '50%' }}>
            <FeatherIcon icon="eye-off" />
          </button>}
      </div>

      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100dvw',
        height: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {
          captureVideo ?
            modelsLoaded ?
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
                  <video ref={videoRef} height={videoHeight} width={videoWidth} onPlay={handleVideoOnPlay} style={{ borderRadius: '10px' }} />
                  <canvas ref={canvasRef} style={{ position: 'absolute' }} />
                </div>
              </div>
              :
              <div>loading...</div>
            :
            <button onClick={startVideo} style={{ cursor: 'pointer', backgroundColor: 'transparent', padding: '15px', border: 'none', borderRadius: '50%' }}>
              <FeatherIcon icon="play" fill='#333' size={36} color="#333" />
            </button>
        }
      </div>

      <div style={{
        position: 'absolute',
        bottom: '1em',
        left: '50%',
        zIndex: 1,
        transform: 'translateX(-50%)'
      }}>
        {isHappy && <FeatherIcon icon='smile' />}
      </div>
    </>
  );
}

export default App;