import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {fromEvent} from 'rxjs';
import MediaItem from 'types/MediaItem';
import PlaylistItem from 'types/PlaylistItem';
import Thumbnail from 'types/Thumbnail';
import {copyToClipboard, formatDate, formatDuration, Logger} from 'utils';
import Button, {CopyButton} from 'components/Button';
import CoverArt from 'components/CoverArt';
import Dialog, {DialogProps, showDialog} from 'components/Dialog';
import useCurrentlyPlaying from 'hooks/useCurrentlyPlaying';
import {
    formatBitDepth,
    formatBitRate,
    formatChannels,
    formatFileSize,
    formatSampleRate,
    FileDetails,
    getDelivery,
    useFileDetails,
} from './nowPlaying';
import './CoverArtDialog.scss';

const logger = new Logger('CoverArtDialog');

const minCoverSize = 160;
const defaultCoverSize = 480; // No image (icon only).
const viewportMargin = 32; // Keep clear of the window edges.

export async function showCoverArtDialog(item: PlaylistItem): Promise<void> {
    await showDialog((props: DialogProps) => <CoverArtDialog {...props} item={item} />);
}

export interface CoverArtDialogProps extends DialogProps {
    item: PlaylistItem;
}

export default function CoverArtDialog({item: initialItem, ...props}: CoverArtDialogProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const artRef = useRef<HTMLDivElement>(null);
    const chromeRef = useRef<{width: number; height: number} | null>(null);
    const currentlyPlaying = useCurrentlyPlaying();
    // Use the live item (e.g. for `playbackType`) while it's still playing.
    const item = currentlyPlaying?.id === initialItem.id ? currentlyPlaying : initialItem;
    const details = useFileDetails(item, true);
    const originalThumbnail = useMemo(() => getOriginalThumbnail(initialItem), [initialItem]);
    const [useOriginal, setUseOriginal] = useState(!!originalThumbnail);
    const [naturalSize, setNaturalSize] = useState(() => getLargestThumbnailSize(initialItem));
    const [coverSize, setCoverSize] = useState(0);
    const coverItem = useMemo(
        () =>
            useOriginal && originalThumbnail
                ? {...initialItem, thumbnails: [originalThumbnail]}
                : initialItem,
        [initialItem, originalThumbnail, useOriginal]
    );

    // As large as possible while keeping the whole dialog on screen,
    // but never larger than the image itself.
    const fitCover = useCallback(() => {
        const content = contentRef.current;
        const art = artRef.current;
        const dialog = content?.closest('dialog');
        if (!dialog?.offsetHeight || !content || !art) {
            return;
        }
        // Space taken by everything except the cover. Measured once, before the cover
        // is sized, so that the dialog can't already be clipped to the viewport.
        if (!chromeRef.current) {
            chromeRef.current = {
                width: dialog.offsetWidth - art.offsetWidth,
                height: dialog.offsetHeight - content.offsetHeight,
            };
        }
        const chrome = chromeRef.current;
        const maxHeight = window.innerHeight - chrome.height - viewportMargin;
        const maxWidth = window.innerWidth - chrome.width - viewportMargin;
        const size = Math.floor(Math.min(naturalSize || defaultCoverSize, maxHeight, maxWidth));
        setCoverSize(Math.max(size, minCoverSize));
    }, [naturalSize]);

    // Measured after the dialog opens (`showModal` is called in an effect).
    useEffect(fitCover, [fitCover]);

    useEffect(() => {
        const subscription = fromEvent(window, 'resize').subscribe(fitCover);
        return () => subscription.unsubscribe();
    }, [fitCover]);

    const handleCoverLoad = useCallback(() => {
        const image = artRef.current?.querySelector('img');
        if (image?.naturalWidth) {
            // Device pixels to CSS pixels.
            const scale = window.devicePixelRatio || 1;
            setNaturalSize(Math.min(image.naturalWidth, image.naturalHeight) / scale);
        }
    }, []);

    const handleCoverError = useCallback(() => {
        if (useOriginal) {
            logger.warn('Failed to load original cover art, using thumbnail');
            setUseOriginal(false);
        }
    }, [useOriginal]);

    const rows = getSummaryRows(item, details);
    const delivery = getDelivery(item);
    const filePath = details.filePath;

    return (
        <Dialog {...props} className="cover-art-dialog" icon="info" title="Track Info">
            <form method="dialog">
                <div
                    className="cover-art-dialog-content"
                    style={{'--cover-size': `${coverSize}px`} as React.CSSProperties}
                    ref={contentRef}
                >
                    <div className="cover-art-dialog-art" ref={artRef}>
                        <CoverArt
                            item={coverItem}
                            size={2000}
                            onLoad={handleCoverLoad}
                            onError={handleCoverError}
                            key={useOriginal ? 'original' : 'thumbnail'}
                        />
                    </div>
                    <div className="cover-art-dialog-info">
                        <table className="cover-art-dialog-summary">
                            <tbody>
                                {rows.map(([label, value]) => (
                                    <tr key={label}>
                                        <th scope="row">{label}</th>
                                        <td>{value}</td>
                                    </tr>
                                ))}
                                {delivery.text ? (
                                    <tr>
                                        <th scope="row">Playback</th>
                                        <td
                                            className={`cover-art-dialog-delivery ${delivery.className}`}
                                        >
                                            {delivery.className ? (
                                                <span className="now-playing-dot" />
                                            ) : null}
                                            {delivery.text}
                                        </td>
                                    </tr>
                                ) : null}
                                {filePath ? (
                                    <tr>
                                        <th scope="row">Location</th>
                                        <td className="cover-art-dialog-location">
                                            <span className="cover-art-dialog-path">
                                                {filePath}
                                            </span>
                                            <FileCopyButton path={filePath} />
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </div>
                <footer className="dialog-buttons">
                    <Button>Close</Button>
                </footer>
            </form>
        </Dialog>
    );
}

function FileCopyButton({path}: {path: string}) {
    const handleClick = useCallback(() => copyToClipboard(path), [path]);
    return (
        <CopyButton
            className="cover-art-dialog-copy"
            title="Copy path"
            aria-label="Copy path"
            onClick={handleClick}
        />
    );
}

function getSummaryRows(item: MediaItem, details: FileDetails) {
    const {codec, container} = details;
    const codecName = (codec || container || '').toUpperCase();
    const containerName = container && codec && container !== codec ? container.toUpperCase() : '';
    const format = containerName ? `${codecName} (${containerName})` : codecName;
    const track = item.track
        ? item.disc
            ? `${item.track} (disc ${item.disc})`
            : String(item.track)
        : item.disc
          ? `Disc ${item.disc}`
          : '';
    const rows: [string, string | undefined][] = [
        ['Title', item.title],
        ['Artist', item.artists?.join(', ')],
        ['Album', item.album],
        ['Album artist', item.albumArtists?.join(', ')],
        ['Track', track],
        ['Year', item.year ? String(item.year) : ''],
        ['Genre', item.genres?.join(', ')],
        ['Duration', item.duration && !item.linearType ? formatDuration(item.duration) : ''],
        ['Format', format],
        ['Bit depth', formatBitDepth(details.bitDepth)],
        ['Sample rate', formatSampleRate(details.sampleRate)],
        ['Channels', formatChannels(details.channels)],
        ['Bitrate', formatBitRate(details.bitRate)],
        ['File size', formatFileSize(details.fileSize)],
        ['Play count', item.playCount ? item.playCount.toLocaleString() : ''],
        ['Date added', item.addedAt ? formatDate(item.addedAt * 1000) : ''],
    ];
    return rows.filter((row): row is [string, string] => !!row[1]);
}

// Emby/Jellyfin thumbnails are resized by the server (see `createThumbnails`).
// Dropping the size params requests the original image.
function getOriginalThumbnail(item: MediaItem): Thumbnail | undefined {
    const [serviceId] = item.src.split(':');
    if (serviceId !== 'emby' && serviceId !== 'jellyfin') {
        return undefined;
    }
    const thumbnail = item.thumbnails?.find((thumbnail) =>
        /\/Images\/Primary\b/.test(thumbnail.url)
    );
    if (!thumbnail) {
        return undefined;
    }
    try {
        const url = new URL(thumbnail.url);
        ['maxWidth', 'maxHeight', 'fillWidth', 'fillHeight'].forEach((param) =>
            url.searchParams.delete(param)
        );
        // Real size is unknown until the image loads.
        return {url: url.href, width: 2000, height: 2000};
    } catch {
        return undefined;
    }
}

function getLargestThumbnailSize(item: MediaItem): number {
    return Math.max(0, ...(item.thumbnails?.map((thumbnail) => thumbnail.width) || []));
}
