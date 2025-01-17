# MixML

**A markup language for representing media performances such as dj mixes or video mixes.**

MixML is a TOML-based language for expressing multiple potentially overlapping media streams rendered over time. The prototypical example is a dj mix, which may feature multiple concurrent audio streams, and effects applied both to individual streams or the combined output. Effects include common operations such as pitching the audio up and down, changing the volume, gain or equalization and more traditional effects such as reverb, echo and compression.

MixML attempts to be concise and not overly pedantic so that the files can be readable, and perhaps as important can be comparable with traditional source control tools. The hope is that people can exchange, remix, extend and collaborate on media mixes in a way that they couldn't easily do before.

## File format

A MixML file is a [TOML](https://toml.io/en/) file whose top level keys are time codes. Time codes are represented as ISO 8601 durations because of their compatibility with TOML top level key character sets, but with two additions:

The "P" that leads a typical ISO8601 duration is not required

The duration can include a suffix, delineated by dash, to create an "identifier" for a particular element (think of it like a track id or a dj deck id).

For example, a simple MixML file that represents a play list with no transitions is as follows:

```toml
[0]
play = "https://music.apple.com/us/album/summer-madness/1445227207?i=1445227844"

[4m19.2s]
play = "https://music.apple.com/us/album/outstanding/1424520684?i=1424520692"
```

This file will play the first track at unity gain for its full duration (since there is nothing to stop it) and begin playing the second at 4 minutes, 19 seconds, and 200 milliseconds, also at unity gain.

This does little more than an M3U, but let's begin by fading both tracks, and matching the BPM (Summer Madness is 85bpm, Outstanding is 101bpm. Don't try this at home).

```toml
[0-1]
play = "https://music.apple.com/us/album/summer-madness/1445227207?i=1445227844"
pitch = +9.04

[4m13s-1]
volume = { value = 0, duration = 10s }

[4m19.2s-2]
play = "https://music.apple.com/us/album/outstanding/1424520684?i=1424520692"
volume = { value = 10, duration = 5s }
pitch = -8.25
```

This file will pitch Summer Madness up by 9.04% and assigns that to track 1. Note that a single track can only play a single piece of content, so if you added an event with a new piece of media that also targeted track 1, it would replace Summer Madness. Then, at 4:13, it will begin to reduce the volume of track 1 such that after 10 seconds it will be at 0 volume. 6.2 seconds after that fade begins, it will begin playing Outstanding pitched down 8.25% such that after 5 seconds, it is at full volume (10).
