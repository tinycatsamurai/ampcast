import React from 'react';
import useCurrentlyPlaying from 'hooks/useCurrentlyPlaying';
import {
    formatBitRate,
    formatFileSize,
    getDelivery,
    getFormatText,
    isLossless,
    useFileDetails,
} from './nowPlaying';

// Shows the audio quality of the current track (from the source file) and
// whether the media server is sending the original file or a transcode.

export default function NowPlayingInfo() {
    const item = useCurrentlyPlaying();
    const details = useFileDetails(item);

    if (!item) {
        return <div className="now-playing-info" />;
    }

    const format = getFormatText(details);
    const bitRate = formatBitRate(details.bitRate);
    const fileSize = formatFileSize(details.fileSize);
    const delivery = getDelivery(item);
    const formatLine = [format, bitRate].filter(Boolean).join(' · ');
    const deliveryLine = [delivery.text, fileSize].filter(Boolean).join(' · ');

    return (
        <div
            className={`now-playing-info ${isLossless(details) ? 'lossless' : ''}`}
            title={[formatLine, deliveryLine].filter(Boolean).join('\n')}
        >
            <p className="now-playing-format">{formatLine || ' '}</p>
            <p className={`now-playing-delivery ${delivery.className}`}>
                {delivery.className ? <span className="now-playing-dot" /> : null}
                {deliveryLine || ' '}
            </p>
        </div>
    );
}
