import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from "../Config/firebase";
import { recordSkillTraining } from '../Services/statService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faVideo, faSpinner, faPlay, faCheck } from '@fortawesome/free-solid-svg-icons';

const VideoTutorialsPage = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loadingVideos, setLoadingVideos] = useState({});
    const [activeVideo, setActiveVideo] = useState(null);
    const videoRefs = useRef({});

    const tutorials = [
        {
            id: 1,
            title: "Basic Ball Control Mastery",
            description: "Learn fundamental ball control techniques essential for any soccer player. Perfect for beginners!",
            videoUrl: "https://www.youtube.com/embed/ObncYq18lMw",
            thumbnail: "https://img.youtube.com/vi/ObncYq18lMw/hqdefault.jpg",
            category: "ball-control",
            requiredLevel: 1,
            duration: "5:21",
            tags: ["basics", "ball control", "beginner"]
        },
        {
            id: 2,
            title: "Advanced Dribbling Skills",
            description: "Master complex dribbling patterns and moves to beat defenders with confidence.",
            videoUrl: "https://www.youtube.com/embed/_uuqsGCiM9I",
            thumbnail: "https://img.youtube.com/vi/_uuqsGCiM9I/hqdefault.jpg",
            category: "dribbling",
            requiredLevel: 3,
            duration: "6:15",
            tags: ["advanced", "dribbling", "skills"]
        },
        {
            id: 3,
            title: "Power Shot Training",
            description: "Develop a powerful and accurate shot with these proven techniques and drills.",
            videoUrl: "https://www.youtube.com/embed/Fj3Jsn0Pa7c",
            thumbnail: "https://img.youtube.com/vi/Fj3Jsn0Pa7c/hqdefault.jpg",
            category: "shooting",
            requiredLevel: 2,
            duration: "7:22",
            tags: ["shooting", "power", "accuracy"]
        },
        {
            id: 4,
            title: "Essential Passing Drills",
            description: "Improve your passing accuracy and technique with these fundamental exercises.",
            videoUrl: "https://www.youtube.com/embed/gedaCw79SlY",
            thumbnail: "https://img.youtube.com/vi/gedaCw79SlY/hqdefault.jpg",
            category: "passing",
            requiredLevel: 1,
            duration: "4:48",
            tags: ["passing", "basics", "technique"]
        },
        {
            id: 5,
            title: "Defensive Positioning Masterclass",
            description: "Learn proper defensive positioning and tactics to stop attackers effectively.",
            videoUrl: "https://www.youtube.com/embed/WBQsqKk8KPs",
            thumbnail: "https://img.youtube.com/vi/WBQsqKk8KPs/hqdefault.jpg",
            category: "defending",
            requiredLevel: 2,
            duration: "5:15",
            tags: ["defense", "positioning", "tactics"]
        },
        {
            id: 6,
            title: "Speed and Agility Training",
            description: "Essential drills to improve your speed, agility, and quick footwork on the field.",
            videoUrl: "https://www.youtube.com/embed/GTnbgXdsK8A",
            thumbnail: "https://img.youtube.com/vi/GTnbgXdsK8A/hqdefault.jpg",
            category: "fitness",
            requiredLevel: 1,
            duration: "4:33",
            tags: ["fitness", "speed", "agility"]
        }
    ];

    const categories = ['all', 'ball-control', 'dribbling', 'shooting', 'passing', 'defending', 'fitness'];

    const filteredTutorials = selectedCategory === 'all' 
        ? tutorials 
        : tutorials.filter(tutorial => tutorial.category === selectedCategory);

    // Add options to YouTube URLs to improve performance
    const getOptimizedVideoUrl = (url) => {
        // Add parameters to improve loading performance
        if (url.includes('youtube.com/embed/')) {
            return `${url}?rel=0&modestbranding=1&enablejsapi=1`;
        }
        return url;
    };

    const handleVideoLoad = (id) => {
        setLoadingVideos(prev => ({...prev, [id]: false}));
    };

    const handleVideoError = (id) => {
        setLoadingVideos(prev => ({...prev, [id]: false}));
        console.error(`Error loading video ${id}`);
    };

    const handleThumbnailClick = (id) => {
        setActiveVideo(id);
        setLoadingVideos(prev => ({...prev, [id]: true}));
    };
    
    // New function to handle video completion
    const handleVideoComplete = (id) => {
        // Track the video view as a training activity
        const tutorial = tutorials.find(t => t.id === id);
        if (tutorial && auth.currentUser) {
            // Record this as a skill training activity
            // Map category to skill name, default to the first skill tag if category doesn't match
            const skillMap = {
                'ball-control': 'dribbling',
                'dribbling': 'dribbling',
                'shooting': 'shooting',
                'passing': 'passing',
                'defending': 'defending',
                'fitness': 'stamina'
            };
            
            const skillName = skillMap[tutorial.category] || tutorial.tags[0] || 'dribbling';
            const xpGained = 5; // Base XP for watching a video
            const duration = 5; // Estimated duration in minutes
            
            console.log(`Recording video tutorial completion as training for ${skillName}`);
            recordSkillTraining(skillName, xpGained, duration);
        }
    };
    
    // Set up YouTube API event listeners
    useEffect(() => {
        // Only run this if there's an active video
        if (activeVideo) {
            // Create YouTube player API event listener
            window.onYouTubeIframeAPIReady = () => {
                const videoId = activeVideo;
                const tutorial = tutorials.find(t => t.id === videoId);
                
                if (tutorial && videoRefs.current[videoId]) {
                    const iframe = videoRefs.current[videoId];
                    const player = new window.YT.Player(iframe, {
                        events: {
                            'onStateChange': (event) => {
                                // Video ended (state = 0)
                                if (event.data === 0) {
                                    handleVideoComplete(videoId);
                                }
                            }
                        }
                    });
                }
            };
            
            // Load YouTube iframe API if not already loaded
            if (!window.YT) {
                const tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                const firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            } else if (window.YT.Player) {
                // If API is already loaded, call the ready function directly
                window.onYouTubeIframeAPIReady();
            }
        }
    }, [activeVideo]);

    // Observer for lazy loading videos
    useEffect(() => {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const videoId = entry.target.dataset.id;
                    if (videoId) {
                        // Preload thumbnail when coming into view
                        const img = new Image();
                        img.src = tutorials.find(t => t.id === parseInt(videoId)).thumbnail;
                    }
                }
            });
        }, options);

        // Observe all video card elements
        const videoCards = document.querySelectorAll('.video-card');
        videoCards.forEach(card => observer.observe(card));

        return () => {
            videoCards.forEach(card => observer.unobserve(card));
        };
    }, [filteredTutorials]);

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <FontAwesomeIcon icon={faVideo} className="me-2" />
                    Video Tutorials
                </h2>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-secondary rounded-pill"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                    Back to Dashboard
                </button>
            </div>

            <div className="mb-4 d-flex gap-2 flex-wrap">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => {
                            setSelectedCategory(category);
                            setActiveVideo(null); // Reset active video when changing category
                        }}
                        className={`btn ${selectedCategory === category ? 'btn-primary' : 'btn-light'} rounded-pill text-capitalize`}
                    >
                        {category.replace('-', ' ')}
                    </button>
                ))}
            </div>

            <div className="row g-4">
                {filteredTutorials.map(tutorial => (
                    <div key={tutorial.id} className="col-md-6 col-lg-4">
                        <div className="card shadow-sm video-card" data-id={tutorial.id}>
                            <div className="card-img-top position-relative" style={{ height: '200px' }}>
                                {activeVideo === tutorial.id ? (
                                    <>
                                        <iframe
                                            ref={el => { videoRefs.current[tutorial.id] = el; }}
                                            width="100%"
                                            height="100%"
                                            src={getOptimizedVideoUrl(tutorial.videoUrl)}
                                            title={tutorial.title}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            onLoad={() => handleVideoLoad(tutorial.id)}
                                            onError={() => handleVideoError(tutorial.id)}
                                            style={{ border: 'none' }}
                                            id={`video-${tutorial.id}`}
                                        />

                                        {loadingVideos[tutorial.id] && (
                                            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50">
                                                <FontAwesomeIcon icon={faSpinner} spin className="text-white fa-3x" />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div 
                                        className="thumbnail-container position-relative w-100 h-100" 
                                        onClick={() => handleThumbnailClick(tutorial.id)}
                                        style={{ 
                                            backgroundImage: `url(${tutorial.thumbnail})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-25 hover-overlay">
                                            <div className="play-button-circle bg-primary d-flex justify-content-center align-items-center rounded-circle" style={{ width: '60px', height: '60px' }}>
                                                <FontAwesomeIcon icon={faPlay} className="text-white fa-lg" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="card-body">
                                <h5 className="card-title">{tutorial.title}</h5>
                                <p className="card-text text-muted">{tutorial.description}</p>
                                <div className="d-flex justify-content-between text-muted small">
                                    <span>Level {tutorial.requiredLevel}</span>
                                    <span>{tutorial.duration}</span>
                                </div>
                                <div className="mt-3 d-flex flex-wrap gap-1">
                                    {tutorial.tags.map(tag => (
                                        <span 
                                            key={tag}
                                            className="badge bg-light text-dark"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx="true">{`
                .thumbnail-container:hover .hover-overlay {
                    background-color: rgba(0, 0, 0, 0.4) !important;
                }
                
                .play-button-circle {
                    transition: transform 0.2s ease;
                }
                
                .thumbnail-container:hover .play-button-circle {
                    transform: scale(1.1);
                }
                
                .card-img-top {
                    overflow: hidden;
                }
                
                .video-card {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
                
                .card-body {
                    flex: 1 1 auto;
                }
            `}</style>
        </div>
    );
};

export default VideoTutorialsPage; 