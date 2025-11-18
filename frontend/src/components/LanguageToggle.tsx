type LanguageToggleProps = {
    language: 'en' | 'ur';
    onToggle: (newLang: 'en' | 'ur') => void;
};

const LanguageToggle = ({ language, onToggle }: LanguageToggleProps) => {
    const handleToggle = () => {
        onToggle(language === 'en' ? 'ur' : 'en');
    };

    return (
        <button
            onClick={handleToggle}
            className="px-4 py-2 rounded-lg bg-primary text-text-light hover:bg-gray-700 transition-colors"
        >
            Switch to {language === 'en' ? 'Urdu' : 'English'}
        </button>
    );
};

export default LanguageToggle;
