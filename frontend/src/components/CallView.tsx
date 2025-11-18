import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import LanguageToggle from './LanguageToggle';
import Subtitles from './Subtitles';
import Waveform from './Waveform';
import { FaPhone, FaPhoneSlash } from 'react-icons/fa';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'ws://localhost:3001';

const CallView = () => {
    const [callState, setCallState] = useState<'idle' | 'calling' | 'connected'>('idle');
    const [language, setLanguage] = useState<'en' | 'ur'>('en');
    const [subtitles, setSubtitles] = useState<{ text: string, speaker: 'me' | 'other' }[]>([]);
    
    const socketRef = useRef<WebSocket | null>(null);
    const peerRef = useRef<RTCPeerConnection | null>(null);
    const myStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const myIdRef = useRef<string | null>(null);

    useEffect(() => {
        return () => {
            socketRef.current?.close();
            peerRef.current?.close();
            myStreamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, []);

    const connectSocket = () => {
        return new Promise<WebSocket>((resolve, reject) => {
            const socket = new WebSocket(BACKEND_URL);
            socket.onopen = () => resolve(socket);
            socket.onerror = (err) => reject(err);
        });
    };

    const handleStartCall = async () => {
        setCallState('calling');
        toast.loading('Requesting permissions...');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            myStreamRef.current = stream;
            setupWaveform(stream);
            toast.dismiss();
            toast.loading('Connecting to server...');

            const socket = await connectSocket();
            socketRef.current = socket;
            
            toast.dismiss();
            toast.success('Connected! Waiting for peer...');
            setCallState('connected');

            setupWebSocketListeners(socket);
            setupPeerConnection(stream);

        } catch (error) {
            toast.dismiss();
            toast.error('Could not start call. Check permissions and server connection.');
            console.error("Error starting call:", error);
            setCallState('idle');
        }
    };

    const setupWebSocketListeners = (socket: WebSocket) => {
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'assign-id':
                    myIdRef.current = data.clientId;
                    break;
                case 'webrtc-offer':
                    handleOffer(data.signalData);
                    break;
                case 'webrtc-answer':
                    handleAnswer(data.signalData);
                    break;
                case 'webrtc-ice-candidate':
                    handleNewICECandidate(data.candidate);
                    break;
                case 'translation-result':
                    handleTranslation(data.payload);
                    break;
                default:
                    break;
            }
        };

        socket.onclose = () => {
            toast.error('Disconnected from server.');
            handleEndCall();
        };
    };

    const setupPeerConnection = (stream: MediaStream) => {
        const peer = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        peerRef.current = peer;

        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                sendMessage({ type: 'webrtc-ice-candidate', candidate: event.candidate });
            }
        };

        peer.ontrack = (event) => {
            const audio = document.createElement('audio');
            audio.srcObject = event.streams[0];
            audio.autoplay = true;
        };
    };
    
    const createOffer = async () => {
        if (!peerRef.current) return;
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        sendMessage({ type: 'webrtc-offer', signalData: offer });
    };

    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
        if (!peerRef.current) return;
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        sendMessage({ type: 'webrtc-answer', signalData: answer });
    };

    const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
        if (!peerRef.current) return;
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleNewICECandidate = async (candidate: RTCIceCandidateInit) => {
        if (!peerRef.current) return;
        try {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    };
    
    const handleTranslation = (payload: any) => {
        const { originalText, translatedText, senderId } = payload;
        if (senderId === myIdRef.current) {
            setSubtitles(prev => [...prev, { text: originalText, speaker: 'me' }]);
        } else {
            setSubtitles(prev => [...prev, { text: translatedText, speaker: 'other' }]);
            speak(translatedText, language === 'en' ? 'ur-PK' : 'en-US');
        }
    };

    const sendMessage = (message: object) => {
        socketRef.current?.send(JSON.stringify(message));
    };

    const handleEndCall = () => {
        socketRef.current?.close();
        peerRef.current?.close();
        myStreamRef.current?.getTracks().forEach(track => track.stop());
        audioContextRef.current?.close();

        setCallState('idle');
        setSubtitles([]);
        if(callState !== 'idle') toast.success('Call ended.');
    };

    const handleLanguageToggle = (newLang: 'en' | 'ur') => {
        setLanguage(newLang);
        sendMessage({ type: 'language-toggle', payload: { language: newLang } });
        toast(`Language switched to ${newLang === 'en' ? 'English' : 'Urdu'}`);
    };

    const setupWaveform = (stream: MediaStream) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 2048;
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
    };

    const speak = (text: string, lang: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        speechSynthesis.speak(utterance);
    };

    return (
        <div className="w-full max-w-4xl h-[90vh] bg-secondary rounded-lg shadow-xl flex flex-col p-6">
            <header className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-text-light">AI Translator</h1>
                {callState === 'connected' && (
                    <LanguageToggle language={language} onToggle={handleLanguageToggle} />
                )}
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative">
                {callState === 'idle' && (
                    <button onClick={handleStartCall} className="flex items-center gap-3 px-6 py-3 bg-accent text-white font-semibold rounded-lg shadow-lg hover:bg-blue-500 transition-colors">
                        <FaPhone />
                        Start Call
                    </button>
                )}
                 {callState === 'connected' && (
                    <button onClick={createOffer} className="flex items-center gap-3 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-lg hover:bg-green-500 transition-colors">
                        Call Peer
                    </button>
                )}

                {callState !== 'idle' && (
                    <>
                        <div className="absolute top-0 w-full h-24">
                            <Waveform analyser={analyserRef.current} />
                        </div>
                        <Subtitles subtitles={subtitles} />
                        <div className="absolute bottom-4 flex items-center gap-4">
                            <button onClick={handleEndCall} className="flex items-center gap-3 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-lg hover:bg-red-500 transition-colors">
                                <FaPhoneSlash />
                                End Call
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default CallView;
