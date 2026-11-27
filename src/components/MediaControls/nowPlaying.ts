import {useEffect, useState} from 'react';
import MediaItem from 'types/MediaItem';
import PlaybackType from 'types/PlaybackType';
import PlaylistItem from 'types/PlaylistItem';
import {getServiceFromSrc, isPersonalMedia} from 'services/mediaServices';

// Shared by `NowPlayingInfo` and `CoverArtDialog`.

// File details (from the source file, not what is streamed).
export type FileDetails = Pick<
    MediaItem,
    | 'codec'
    | 'container'
    | 'sampleRate'
    | 'bitDepth'
    | 'channels'
    | 'bitRate'
    | 'fileSize'
    | 'filePath'
>;

export interface Delivery {
    readonly text: string;
    readonly className: '' | 'direct' | 'transcoded';
}

const losslessCodecs = /^(flac|alac|ape|wavpack|wv|tta|pcm.*|wav|aiff?|dsd.*|mlp|truehd)$/i;

// Details fetched for items that were added to the playlist before these fields
// existed (keyed by `src`). Each item is only fetched once.
const fetchedDetails = new Map<string, Promise<FileDetails>>();

export function useFileDetails(item: PlaylistItem | null, includePath = false): FileDetails {
    const src = item?.src || '';
    const needsFetch =
        !!item &&
        !item.blob &&
        isPersonalMedia(item) &&
        (!item.sampleRate || (includePath && !item.filePath));
    const [fetched, setFetched] = useState<FileDetails | undefined>();

    useEffect(() => {
        setFetched(undefined);
        if (!src || !needsFetch) {
            return;
        }
        let request = fetchedDetails.get(src);
        if (!request) {
            const service = getServiceFromSrc({src});
            if (!service?.getMediaObject) {
                return;
            }
            request = service
                .getMediaObject<MediaItem>(src)
                .then(pickFileDetails)
                .catch(() => ({}));
            fetchedDetails.set(src, request);
        }
        let cancelled = false;
        request.then((details) => {
            if (!cancelled) {
                setFetched(details);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [src, needsFetch]);

    return item ? {...fetched, ...pickFileDetails(item)} : {};
}

function pickFileDetails(item: MediaItem): FileDetails {
    const details: Record<string, unknown> = {
        codec: item.codec,
        container: item.container,
        sampleRate: item.sampleRate,
        bitDepth: item.bitDepth,
        channels: item.channels,
        bitRate: item.bitRate,
        fileSize: item.fileSize,
        filePath: item.filePath,
    };
    // Drop missing values so they don't overwrite fetched ones.
    Object.keys(details).forEach((key) => details[key] == null && delete details[key]);
    return details as FileDetails;
}

export function isLossless({codec, container}: FileDetails): boolean {
    return losslessCodecs.test(codec || container || '');
}

export function getFormatText({
    codec,
    container,
    sampleRate,
    bitDepth,
    channels,
}: FileDetails): string {
    const name = (codec || container || '').toUpperCase();
    const resolution = [formatBitDepth(bitDepth), formatSampleRate(sampleRate)]
        .filter(Boolean)
        .join(' / ');
    const channelText = channels && channels !== 2 ? formatChannels(channels) : '';
    return [name, resolution, channelText].filter(Boolean).join(' · ');
}

export function formatBitDepth(bitDepth = 0): string {
    return bitDepth ? `${bitDepth}-bit` : '';
}

export function formatSampleRate(sampleRate = 0): string {
    return sampleRate ? `${Number((sampleRate / 1000).toFixed(1))} kHz` : '';
}

export function formatChannels(channels = 0): string {
    switch (channels) {
        case 0:
            return '';
        case 1:
            return 'mono';
        case 2:
            return 'stereo';
        default:
            return `${channels}ch`;
    }
}

export function formatBitRate(bitRate = 0): string {
    return bitRate ? `${bitRate.toLocaleString()} kbps` : '';
}

export function formatFileSize(bytes = 0): string {
    if (!bytes) {
        return '';
    }
    const mb = bytes / (1024 * 1024);
    return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
}

export function getDelivery(item: PlaylistItem): Delivery {
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
