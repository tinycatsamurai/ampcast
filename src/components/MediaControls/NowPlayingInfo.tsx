import React, {useEffect, useState} from 'react';
import MediaItem from 'types/MediaItem';
import PlaybackType from 'types/PlaybackType';
import PlaylistItem from 'types/PlaylistItem';
import {getServiceFromSrc, isPersonalMedia} from 'services/mediaServices';
import useCurrentlyPlaying from 'hooks/useCurrentlyPlaying';

// Shows the audio quality of the current track (from the source file) and
// whether the media server is sending the original file or a transcode.

type AudioQuality = Pick<
    MediaItem,
    'codec' | 'container' | 'sampleRate' | 'bitDepth' | 'channels' | 'bitRate' | 'fileSize'
>;

const losslessCodecs = /^(flac|alac|ape|wavpack|wv|tta|pcm.*|wav|aiff?|dsd.*|mlp|truehd)$/i;

// Quality details fetched for items that were added to the playlist before
// these fields existed (keyed by `src`).
const fetchedQuality = new Map<string, AudioQuality>();

export default function NowPlayingInfo() {
    const item = useCurrentlyPlaying();
    const quality = useAudioQuality(item);

    if (!item) {
        return <div className="now-playing-info" />;
    }

    const format = getFormatText(quality);
    const bitRate = quality.bitRate ? `${quality.bitRate.toLocaleString()} kbps` : '';
    const fileSize = formatFileSize(quality.fileSize);
    const delivery = getDelivery(item);
    const formatLine = [format, bitRate].filter(Boolean).join(' · ');
    const deliveryLine = [delivery.text, fileSize].filter(Boolean).join(' · ');
    const isLossless = losslessCodecs.test(quality.codec || quality.container || '');

    return (
        <div
            className={`now-playing-info ${isLossless ? 'lossless' : ''}`}
            title={[formatLine, deliveryLine].filter(Boolean).join('\n')}
        >
            <p className="now-playing-format">{formatLine || ' '}</p>
            <p className={`now-playing-delivery ${delivery.className}`}>
                {delivery.className ? <span className="now-playing-dot" /> : null}
                {deliveryLine || ' '}
            </p>
        </div>
    );
}

function useAudioQuality(item: PlaylistItem | null): AudioQuality {
    const src = item?.src || '';
    const needsFetch = !!item && !item.blob && !item.sampleRate && isPersonalMedia(item);
    const [fetched, setFetched] = useState<AudioQuality | undefined>();

    useEffect(() => {
        setFetched(fetchedQuality.get(src));
        if (!src || !needsFetch || fetchedQuality.has(src)) {
            return;
        }
        const service = getServiceFromSrc({src});
        if (!service?.getMediaObject) {
            return;
        }
        let cancelled = false;
        fetchedQuality.set(src, {}); // Only try once.
        service
            .getMediaObject<MediaItem>(src)
            .then((object) => {
                const quality = pickQuality(object);
                fetchedQuality.set(src, quality);
                if (!cancelled) {
                    setFetched(quality);
                }
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [src, needsFetch]);

    return item ? {...fetched, ...pickQuality(item)} : {};
}

function pickQuality(item: MediaItem): AudioQuality {
    const quality: Record<string, unknown> = {
        codec: item.codec,
        container: item.container,
        sampleRate: item.sampleRate,
        bitDepth: item.bitDepth,
        channels: item.channels,
        bitRate: item.bitRate,
        fileSize: item.fileSize,
    };
    // Drop missing values so they don't overwrite fetched ones.
    Object.keys(quality).forEach((key) => quality[key] == null && delete quality[key]);
    return quality as AudioQuality;
}

function getFormatText({codec, container, sampleRate, bitDepth, channels}: AudioQuality): string {
    const name = (codec || container || '').toUpperCase();
    const depth = bitDepth ? `${bitDepth}-bit` : '';
    const rate = sampleRate ? `${Number((sampleRate / 1000).toFixed(1))} kHz` : '';
    const resolution = [depth, rate].filter(Boolean).join(' / ');
    const channelText = channels && channels !== 2 ? (channels === 1 ? 'mono' : `${channels}ch`) : '';
    return [name, resolution, channelText].filter(Boolean).join(' · ');
}

function getDelivery(item: PlaylistItem): {text: string; className: string} {
    if (item.blob || item.src.startsWith('blob:')) {
        return {text: 'Local file', className: 'direct'};
    }
    const service = getServiceFromSrc(item);
    if (!isPersonalMedia(item)) {
        return {text: service?.name || '', className: ''};
    }
    switch (item.playbackType) {
        case undefined:
            return {text: 'Checking…', className: ''};

        case PlaybackType.HLS:
        case PlaybackType.DASH: {
            const [serviceId] = item.src.split(':');
            const target = serviceId === 'emby' || serviceId === 'jellyfin' ? ' to AAC' : '';
            return {text: `Transcoded${target}`, className: 'transcoded'};
        }

        default:
            return {text: 'Direct', className: 'direct'};
    }
}

function formatFileSize(bytes = 0): string {
    if (!bytes) {
        return '';
    }
    const mb = bytes / (1024 * 1024);
    return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
}
