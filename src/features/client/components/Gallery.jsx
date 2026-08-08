import React, { useState, useEffect } from "react";
import axios from "../../../shared/utils/axios";
import { Image as ImageIcon, Download, Loader2, X } from "lucide-react";
import useHaptics from "../../../shared/hooks/useHaptics";
import RefreshButton from "../../../shared/components/RefreshButton";

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const { trigger } = useHaptics();

  const project = JSON.parse(localStorage.getItem("clientProject") || "{}");
  const projectId = project.id;

  const apiUrl =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    (import.meta.env.PROD ? "" : "http://localhost:5000");

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/project-data/${projectId}/images`);
      setImages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchImages();
    }
  }, [projectId]);

  // ✅ Mobile-safe download handler
  const handleDownload = (imgUrl, id) => {
    trigger("medium");
    setDownloadingId(id);

    try {
      const link = document.createElement("a");
      link.href = imgUrl;
      link.target = "_blank";
      link.rel = "noopener";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      trigger("success");
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setTimeout(() => setDownloadingId(null), 800);
    }
  };

  if (!projectId) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8 px-2 md:px-0">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-100">
            <ImageIcon size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
              Site Gallery
            </h2>
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 md:mt-1">
              Visual Progress Documentation
            </p>
          </div>
        </div>
        <RefreshButton onRefresh={fetchImages} isLoading={loading} className="md:hidden" />
        <RefreshButton onRefresh={fetchImages} isLoading={loading} label="Refresh" className="hidden md:flex" />
      </div>


      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/50">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-400">
            Loading gallery...
          </p>
        </div>
      ) : images.length === 0 ? (
        /* Empty */
        <div className="flex flex-col items-center justify-center py-20 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/50 text-center px-6">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <ImageIcon size={32} />
          </div>
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
            No Images Yet
          </h3>
          <p className="text-xs text-slate-400 font-bold mt-1">
            Site photos will appear here once uploaded by the team.
          </p>
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => {
            const fullUrl = `${apiUrl}${img.url}`;

            return (
              <div
                key={img.id}
                role="button"
                tabIndex={0}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 shadow-sm transition-transform duration-200 cursor-pointer active:scale-[0.98] outline-none z-[10] relative"
                onClick={() => setSelectedImage(img)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedImage(img);
                  }
                }}
                aria-label={`View ${img.caption || "image"}`}
              >
                <img
                  src={fullUrl}
                  alt={img.caption || "Site Image"}
                  className="w-full h-full object-cover pointer-events-none transition-transform group-hover:scale-105"
                  loading="lazy"
                  draggable="false"
                />

                {/* Download Button (Overlay) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(fullUrl, img.id);
                  }}
                  className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur rounded-full text-slate-700 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10 hover:bg-white hover:text-indigo-600 active:scale-95 pointer-events-auto cursor-pointer"
                  title="Download Image"
                >
                  {downloadingId === img.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                </button>

                {img.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 pointer-events-none text-left">
                    <p className="text-white text-[10px] font-bold line-clamp-2 uppercase tracking-wide">
                      {img.caption}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-6 right-6 text-white/70 hover:text-white p-2 z-[110]" onClick={() => setSelectedImage(null)}>
            <X size={32} />
          </button>

          <img
            src={`${apiUrl}${selectedImage.url}`}
            alt={selectedImage.caption}
            className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          <div
            className="absolute bottom-0 left-0 right-0 p-8 pb-10 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center gap-6 z-[110]"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedImage.caption && (
              <p className="text-white text-xs md:text-sm font-medium text-center max-w-md leading-relaxed">{selectedImage.caption}</p>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(`${apiUrl}${selectedImage.url}`, selectedImage.id);
              }}
              className="w-full max-w-sm bg-white text-slate-900 py-3.5 md:py-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 active:scale-95 transition-transform shadow-xl hover:bg-slate-50"
            >
              {downloadingId === selectedImage.id ? <Loader2 size={16} className="animate-spin md:w-5 md:h-5" /> : <Download size={16} className="md:w-5 md:h-5" />}
              Save to Gallery
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
