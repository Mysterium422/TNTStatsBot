# To Do:   
- [x] Finish stats command
- [ ] Kills command
- [ ] [Recordings](#stats-recordings)
- [ ] Weekly/Monthly Cache & Leaerboards

## Stats Recordings
 - A stats recording can be started, and every recording has a target.
 - When you start a recording, the current stats of the target are cached.
```
/record <username (defaults to you)>
```

 - Whenever **YOU** check that target's stats, the difference since you started recording them is shown. This is the **only** way `()`s can be shown

 - You can stop recording with the `finish` command. After doing that, no `()`s will show and stats will not be cached until you start recording.
```
/finish <username (defaults to you)>
```

 - You can reset the current recording with the `reset` command. After doing that, the stats will recache and `()`s will display (but they will all be since you did the reset). Doing a reset is basically like finishing & then recording again immediately.
```
/reset <username (defaults to you)>
```

### Modifiable with a setting:
If you check another user's stats, it will start a *temporary recording* (**as long as you were not explicitly recording said user already**)
 - The next time you check their stats, it will show the `()`s for that *temporary recording*. It will also immediately `/reset` the *temporary recording*