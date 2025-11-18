type Subtitle = {
    text: string;
    speaker: 'me' | 'other';
};

type SubtitlesProps = {
    subtitles: Subtitle[];
};

const Subtitles = ({ subtitles }: SubtitlesProps) => {
    return (
        <div className="w-full h-full flex flex-col justify-end p-4 space-y-2">
            {subtitles.map((subtitle, index) => (
                <div
                    key={index}
                    className={`p-3 rounded-lg max-w-[70%] ${
                        subtitle.speaker === 'me'
                            ? 'bg-accent self-end text-white'
                            : 'bg-gray-600 self-start text-text-light'
                    }`}
                >
                    <p>{subtitle.text}</p>
                </div>
            ))}
        </div>
    );
};

export default Subtitles;
