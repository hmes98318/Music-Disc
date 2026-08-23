import { Track } from 'lavashark';

import type { Player } from 'lavashark';


type QueueTrack = Player['queue']['tracks'][number];


/**
 * Check whether a LavaShark queue track represents an ephemeral radio request.
 */
export function isRadioTrack(
    track: QueueTrack | null,
): track is Track & { isRadio: true } {
    return track instanceof Track && track.isRadio === true;
}
