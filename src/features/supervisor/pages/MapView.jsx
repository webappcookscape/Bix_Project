import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from '../../../shared/utils/axios';
import { useNavigate, useOutletContext } from 'react-router-dom';

// Fix for default Leaflet markers in React/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = () => {
    const navigate = useNavigate();
    // Safely get context, default to empty object if null (though layout provides it)
    const { searchTerm } = useOutletContext() || { searchTerm: '' };
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const defaultCenter = [12.9716, 77.5946]; // Bangalore (Default fallback)

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await axios.get('/tasks');
            const myTasks = response.data.filter(t => t.employeeId === user.id);

            // Filter and Enhance tasks with Mock Coordinates if missing
            // In production, effective geocoding or saved lat/long on Project is required.
            // Simple static geocoding for demo purposes
            const getLocationCoords = (locationStr) => {
                if (!locationStr) return null;
                const lower = locationStr.toLowerCase();
                if (lower.includes('vadapalani')) return { lat: 13.0490, lng: 80.2116 }; // Vadapalani
                if (lower.includes('chennai')) return { lat: 13.0827, lng: 80.2707 };    // Chennai General
                if (lower.includes('bangalore') || lower.includes('bengaluru')) return { lat: 12.9716, lng: 77.5946 };
                return null;
            };

            const enhancedTasks = myTasks.map((task, index) => {
                // Generates a deterministic small offset based on task ID to prevent perfect overlap
                const pseudoRandom = (seed) => {
                    let value = 0;
                    for (let i = 0; i < seed.length; i++) value += seed.charCodeAt(i);
                    return (Math.sin(value) * 0.0002); // Approx 20 meters offset
                };

                const jitterLat = pseudoRandom(task.id);
                const jitterLng = pseudoRandom(task.id + 'lng');

                // 1. Evidence Location (Real)
                if (task.evidence && task.evidence.length > 0) {
                    return {
                        ...task,
                        lat: task.evidence[0].latitude + jitterLat,
                        lng: task.evidence[0].longitude + jitterLng,
                        hasRealLocation: true
                    };
                }

                // 2. Project Exact GPS (from Admin)
                if (task.project?.latitude && task.project?.longitude) {
                    return {
                        ...task,
                        lat: task.project.latitude + jitterLat,
                        lng: task.project.longitude + jitterLng,
                        hasRealLocation: true, // It is real, just project-level, not task-evidence-level
                        isProjectLevel: true
                    };
                }

                // 3. Project Address Match (Static Map / Fallback)
                const projectCoords = getLocationCoords(task.project?.location);
                if (projectCoords) {
                    return {
                        ...task,
                        lat: projectCoords.lat + jitterLat,
                        lng: projectCoords.lng + jitterLng,
                        hasRealLocation: false, // It's still inferred, not GPS tagged evidence
                        isInferred: true
                    };
                }

                // 3. Fallback Simulation (Bangalore Circle)
                const angle = (index / (myTasks.length || 1)) * Math.PI * 2;
                const radius = 0.05;
                return {
                    ...task,
                    lat: defaultCenter[0] + Math.cos(angle) * radius,
                    lng: defaultCenter[1] + Math.sin(angle) * radius,
                    hasRealLocation: false
                };
            });

            setTasks(enhancedTasks);
        } catch (error) {
            console.error("Error loading map data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter tasks based on global search term
    const filteredTasks = tasks.filter(task => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            task.title?.toLowerCase().includes(term) ||
            task.project?.name?.toLowerCase().includes(term) ||
            task.status?.toLowerCase().includes(term)
        );
    });

    if (loading) return (
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-120px)] w-full rounded-3xl overflow-hidden border border-slate-200 shadow-xl relative z-0">
            <MapContainer
                center={defaultCenter}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapBounds tasks={filteredTasks} />

                {filteredTasks.map(task => (
                    <Marker
                        key={task.id}
                        position={[task.lat, task.lng]}
                    >
                        <Popup>
                            <div className="min-w-[200px] p-1">
                                <h3 className="font-bold text-slate-800 text-sm mb-1">{task.title}</h3>
                                <p className="text-xs text-slate-500 mb-2 truncate max-w-[180px]">
                                    {task.project?.name || 'Unknown Project'}
                                </p>

                                <div className="flex gap-2 mb-3 flex-wrap">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                                        {task.status}
                                    </span>
                                    {!task.hasRealLocation && (
                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                                            Simulated
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => navigate(`../tasks/${task.id}`)}
                                        className="py-1.5 px-3 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
                                    >
                                        Details
                                    </button>
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${task.lat},${task.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-1.5 px-3 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors text-center shadow-sm flex items-center justify-center gap-1"
                                    >
                                        <span>Directions</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 9l-6 6 6 6" /><path d="M20 4v7a4 4 0 0 1-4 4H4" /></svg>
                                    </a>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Legend / Overlay */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-100 z-[1000] max-w-xs">
                <h4 className="font-bold text-slate-800 text-sm mb-2">Map Legend</h4>
                <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                        <img src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png" className="w-3 h-5" alt="marker" />
                        <span>Task Location</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 italic">
                        * Note: Locations are simulated for pending tasks without explicit geotags.
                    </p>
                </div>
            </div>
        </div>
    );
};

// Component to fly to bounds of markers
const MapBounds = ({ tasks }) => {
    const map = useMap();

    useEffect(() => {
        if (tasks.length > 0) {
            const bounds = L.latLngBounds(tasks.map(t => [t.lat, t.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [tasks, map]);

    return null;
};

export default MapView;
