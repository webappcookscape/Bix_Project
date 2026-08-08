import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertTriangle, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const LiveCameraCapture = ({ onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(""); // For loading status text
    const [error, setError] = useState(null);

    const startCamera = async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Prefer back camera
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setError("Could not access camera. Please allow permissions.");
            toast.error("Camera access failed");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    // Helper: Load Image from URL
    const loadImage = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null); // Fail silently for optional images
            img.src = url;
        });
    };

    // Helper: Tile math for OSM
    const long2tile = (lon, zoom) => (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
    const lat2tile = (lat, zoom) => (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));

    const capturePhoto = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current) return;

        // 1. Check Permission & Get Grid
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported.");
            return;
        }

        setLoading(true);
        setStatus("Acquiring GPS Signal...");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude, accuracy } = position.coords;
                    setLocation({ latitude, longitude, accuracy });

                    const video = videoRef.current;
                    const canvas = canvasRef.current;
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');

                    // 2. Refresh Status
                    setStatus("Fetching Location Details...");

                    // 3. Draw Video Frame (Base Layer)
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    // 4. Fetch Address (Reverse Geocoding)
                    let addressText = "Location details not available";
                    try {
                        const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await resp.json();
                        addressText = data.display_name || "Unknown Location";
                        // Shorten address if too long
                        if (addressText.length > 80) addressText = addressText.substring(0, 80) + "...";
                    } catch (e) {
                        console.error("Address fetch failed", e);
                    }

                    // 5. Fetch Map Tile (OSM)
                    setStatus("Generating Map Overlay...");
                    const zoom = 15;
                    const x = long2tile(longitude, zoom);
                    const y = lat2tile(latitude, zoom);
                    const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
                    const mapImg = await loadImage(tileUrl);

                    // --- COMPOSITING OVERLAY ---

                    // A. Dark Semi-transparent Footer Background
                    const footerHeight = canvas.height * 0.25; // 25% of height
                    const footerY = canvas.height - footerHeight;

                    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                    ctx.fillRect(0, footerY, canvas.width, footerHeight);

                    // B. Draw Map Snippet (Left Side of Footer)
                    const mapSize = footerHeight - 20; // Padding
                    const mapX = 20;
                    const mapY = footerY + 10;

                    ctx.fillStyle = "#333";
                    ctx.fillRect(mapX, mapY, mapSize, mapSize); // Map placeholder bg

                    if (mapImg) {
                        ctx.drawImage(mapImg, mapX, mapY, mapSize, mapSize);
                        // Draw pin in center of map tile
                        ctx.fillStyle = "red";
                        ctx.beginPath();
                        ctx.arc(mapX + mapSize / 2, mapY + mapSize / 2, 5, 0, 2 * Math.PI);
                        ctx.fill();

                        // Map Border
                        ctx.strokeStyle = "white";
                        ctx.lineWidth = 2;
                        ctx.strokeRect(mapX, mapY, mapSize, mapSize);
                    }

                    // C. Draw Text Info (Right of Map)
                    const textX = mapX + mapSize + 20;
                    const textStartY = footerY + 40;

                    ctx.fillStyle = "white";
                    ctx.textAlign = "left";

                    // 1. Date & Time
                    const now = new Date();
                    ctx.font = "bold 40px sans-serif";
                    ctx.fillText(now.toLocaleString(), textX, textStartY);

                    // 2. Address (Multiline if needed, simplified here)
                    ctx.font = "24px sans-serif";
                    ctx.fillStyle = "#ddd";
                    ctx.fillText(addressText, textX, textStartY + 40);

                    // 3. Lat / Long
                    ctx.font = "20px monospace";
                    ctx.fillStyle = "#aaa";
                    ctx.fillText(`Lat: ${latitude.toFixed(6)}  Long: ${longitude.toFixed(6)}`, textX, textStartY + 80);

                    // 4. Accuracy
                    ctx.fillText(`GPS Accuracy: ${accuracy.toFixed(1)}m`, textX, textStartY + 110);

                    // 5. Branding
                    ctx.fillStyle = "#FFD700"; // Gold
                    ctx.font = "italic bold 20px sans-serif";
                    ctx.fillText("Powered by Orbix Projects GPS Cam", canvas.width - 320, canvas.height - 20);

                    // --- FINALIZE ---
                    setStatus("Processing...");
                    canvas.toBlob((blob) => {
                        const previewUrl = URL.createObjectURL(blob);
                        setCapturedImage(previewUrl);
                        setLoading(false);
                        setStatus("");

                        // Pass to parent
                        const file = new File([blob], `gps-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        onCapture(file, { latitude, longitude, accuracy }, now);
                        stopCamera();
                    }, 'image/jpeg', 0.95);

                } catch (err) {
                    console.error("Overlay process failed", err);
                    setLoading(false);
                    toast.error("Failed to process image overlay");
                }
            },
            (err) => {
                setLoading(false);
                toast.error("Location access denied. GPS stamp requires location.");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [onCapture, stream]);

    const retake = () => {
        setCapturedImage(null);
        setLocation(null);
        startCamera();
        setError(null);
    };

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center justify-center flex-col text-center border-2 border-red-100">
                <AlertTriangle className="w-8 h-8 mb-2" />
                <p className="font-bold">Camera Error</p>
                <p className="text-sm mb-4">{error}</p>
                <button onClick={startCamera} className="bg-red-100 px-4 py-2 rounded-lg text-red-700 font-bold text-sm">Retry Camera</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto relative rounded-3xl overflow-hidden shadow-2xl bg-black aspect-[9/16] md:aspect-auto">
            {!capturedImage ? (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover min-h-[400px]"
                    />

                    {/* Overlay Grid lines for professional feel */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                        <div className="w-full h-1/3 border-b border-white"></div>
                        <div className="w-full h-1/3 top-1/3 absolute border-b border-white"></div>
                        <div className="h-full w-1/3 absolute left-0 border-r border-white"></div>
                        <div className="h-full w-1/3 absolute right-1/3 border-r border-white"></div>
                    </div>

                    <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6">
                        {/* Flash/Settings toggles could go here */}
                        <button
                            onClick={capturePhoto}
                            disabled={loading}
                            className="bg-white p-1 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            <div className="border-4 border-slate-200 rounded-full p-1">
                                <div className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center">
                                    <Camera className="text-white w-8 h-8" />
                                </div>
                            </div>
                        </button>
                    </div>

                    {loading && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white z-50">
                            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="font-bold text-lg">{status || "Processing..."}</p>
                            <p className="text-xs text-slate-400 mt-2">Checking Satellites & Fetching Map...</p>
                        </div>
                    )}
                </>
            ) : (
                <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                    <img src={capturedImage} alt="Captured" className="w-full h-auto max-h-[600px] object-contain" />
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button
                            onClick={retake}
                            className="bg-white text-slate-900 px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-slate-100 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" /> Retake
                        </button>
                    </div>
                </div>
            )}

            {/* Hidden Canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default LiveCameraCapture;
