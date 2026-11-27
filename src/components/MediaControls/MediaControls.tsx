import React, {useCallback} from 'react';
import {ListViewHandle} from 'components/ListView';
import {IconButtons} from 'components/Button';
import CoverArt from 'components/CoverArt';
import useCurrentlyPlaying from 'hooks/useCurrentlyPlaying';
import usePlaybackState from 'hooks/usePlaybackState';
import MediaButtons from './MediaButtons';
import {showCoverArtDialog} from './CoverArtDialog';
import NowPlayingInfo from './NowPlayingInfo';
import PlaylistMenuButton from './PlaylistMenuButton';
import RadioButtons from './RadioButtons';
import TimeControl from './TimeControl';
import VolumeControl from './VolumeControl';
import './MediaControls.scss';
import './MediaControls-overlay.scss';

export interface MediaControlsProps {
    overlay?: boolean;
    playlistRef?: React.RefObject<ListViewHandle | null>;
}

export default function MediaControls({overlay, playlistRef}: MediaControlsProps) {
    const currentlyPlaying = useCurrentlyPlaying();
    const {paused} = usePlaybackState();

    const openCoverArtDialog = useCallback(() => {
        if (currentlyPlaying) {
            showCoverArtDialog(currentlyPlaying);
        }
    }, [currentlyPlaying]);

    const handleCoverKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openCoverArtDialog();
            }
        },
        [openCoverArtDialog]
    );

    return (
        <div className={`media-controls${overlay ? '-overlay' : ''}`}>
            {overlay ? null : (
                <div
                    className="now-playing-cover"
                    role={currentlyPlaying ? 'button' : undefined}
                    tabIndex={currentlyPlaying ? 0 : undefined}
                    title={currentlyPlaying ? 'Show cover art and file info' : undefined}
                    onClick={openCoverArtDialog}
                    onKeyDown={handleCoverKeyDown}
                >
                    {currentlyPlaying ? <CoverArt item={currentlyPlaying} size={240} /> : null}
                </div>
            )}
            <TimeControl overlay={overlay} />
            <div className="playback-control">
                <VolumeControl overlay={overlay} />
                {overlay ? (
                    <>
                        <IconButtons className="media-buttons">
                            <MediaButtons overlay={overlay} />
                        </IconButtons>
                        {currentlyPlaying?.skippable && !paused ? (
                            <IconButtons className="radio-buttons">
                                <RadioButtons overlay />
                            </IconButtons>
                        ) : null}
                    </>
                ) : (
                    <>
                        <NowPlayingInfo />
                        <div className="media-buttons">
                            <MediaButtons overlay={overlay} playlistRef={playlistRef} />
                        </div>
                    </>
                )}
                {!overlay && playlistRef ? <PlaylistMenuButton playlistRef={playlistRef} /> : null}
            </div>
        </div>
    );
}
