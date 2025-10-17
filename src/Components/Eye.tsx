import './Eye.css'

export default function Eye({ size = '24px' }: { size?: number | string }) {
    return (
        <svg viewBox="0 0 24 24" style={{ width: size, height: size }} >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />

            <g className="pupil">
                <circle cx="12" cy="12" r="3" />
            </g>
        </svg>
    );
}