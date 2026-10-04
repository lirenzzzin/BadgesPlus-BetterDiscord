# BadgesPlus for BetterDiscord

**🇺🇸 English** · [🇧🇷 Português](README.pt-BR.md)

A **[BetterDiscord](https://betterdiscord.app)** plugin that shows people's profile badges **without opening their profile** and lets you **search server members by badge**.

> Using Vesktop or Vencord? Get the version with an automatic installer: **[lirenzzzin/BadgesPlus](https://github.com/lirenzzzin/BadgesPlus)**

- Badges right after the name, **in chat and in the member list**
- Badge search: find who has **Nitro Opal**, **Early Supporter**, **24-month Boost**, **HypeSquad**... and message them directly
- 29 settings: size, spacing, limit, order, which badges to show, loading speed and more
- **English and Portuguese**: follows Discord's language, or pick one in the settings

---

## Install

1. Download **[`BadgesPlus.plugin.js`](https://raw.githubusercontent.com/lirenzzzin/BadgesPlus-BetterDiscord/main/BadgesPlus.plugin.js)** (right-click the link → *Save link as...*).
2. In Discord, go to **User Settings → BetterDiscord → Plugins → Open Plugins Folder**.
3. Move `BadgesPlus.plugin.js` into that folder.
4. Back in **Plugins**, turn on **BadgesPlus**.

The plugins folder is usually:

| System | Folder |
|---|---|
| Windows | `%appdata%\BetterDiscord\plugins` |
| macOS | `~/Library/Application Support/BetterDiscord/plugins` |
| Linux | `~/.config/BetterDiscord/plugins` |

### Update

Download `BadgesPlus.plugin.js` again and replace the old file in the plugins folder. BetterDiscord reloads it by itself.

### Uninstall

Turn the plugin off in **Plugins** and delete `BadgesPlus.plugin.js` from the plugins folder.

---

## How to use

### Badges next to the name

Once the plugin is on, badges show up by themselves in chat and in the member list. Hover over one to see its name.

- Badges like **HypeSquad, Bug Hunter, Early Supporter and Active Developer** show up right away.
- **Nitro and Boost** only exist in the person's full profile. The plugin loads profiles in the background, one at a time, starting with whoever is on screen, so these appear gradually.

### Badge search

1. Open a channel in any server.
2. Click the **Nitro icon** in the channel bar, next to pins and the member list.
3. You'll see buttons for every badge in the server and how many people have each one.
4. Click a badge to select it. It gets a **green outline** and the list of people who have it appears.
5. Select several to combine them. By default only people with **all** of them show up; you can switch to **any** in the settings.
6. For each person in the results:
   - click the **name or avatar** to open their profile;
   - click the **chat bubble** to open a DM with them.

**Tips**

- Discord only loads part of the members of big servers. The search shows "X members loaded of Y". Scrolling the member list loads more people.
- The **"Load badges of N members"** link fetches the profile of whoever is missing, to find Nitro and Boost. You can see how many are left and click **Stop** at any time.

---

## Settings

In **User Settings → BetterDiscord → Plugins → BadgesPlus** (gear icon). Everything applies immediately, no restart needed.

| Group | Options |
|---|---|
| **Language** | Auto (follows Discord) · English · Português |
| **Where to show** | In chat · In the member list · On your own account · On bots |
| **Appearance** | Size in chat · Size in member list · Space between badges · Max badges per person · Show "+N" when over the limit · Order (same as Discord / Nitro first / Nitro last) · Hover text (short name or Discord's text) |
| **Which badges** | Nitro · Boost · HypeSquad · Discord programs (Staff, Partner, Bug Hunter, Early Supporter, Developers...) · Originally known as · Quests and Orbs · Other |
| **Loading** | Load profiles automatically · Speed (Fast 0.5s / Normal 1s / Safe 2s / Very safe 4s) · Load bot profiles |
| **Search** | Show the button · Combine badges (all / any) · Load badges when opening · Message button · Close the search when opening a DM · Include bots · Max results |

The settings panel shows up in the language chosen in **Language**. After changing it, close and reopen the panel.

---

## Troubleshooting

**The plugin doesn't show up in the plugin list**
- Check that the file is named exactly `BadgesPlus.plugin.js` (Windows sometimes adds `.txt` or `(1)` to downloads).
- Check that it's in the plugins folder itself, not in a subfolder.

**The Nitro button doesn't show up in the channel bar**
- It only shows up inside servers, not in DMs.
- Check that **"Badge search button"** is on in the plugin settings.

**Badges or the button stopped showing up after a Discord update**
- Discord sometimes changes its layout. Open the console (`Ctrl+Shift+I`), look for errors mentioning "BadgesPlus" and [open an issue](https://github.com/lirenzzzin/BadgesPlus-BetterDiscord/issues).

**Nitro/Boost badges take a while to show up**
- That's normal: Discord hands out one profile at a time. If Discord asks to slow down, the plugin slows down by itself. If it takes too long, use the **Normal** speed.

---

## Disclaimer

Client mods like BetterDiscord are against Discord's Terms of Service. Use at your own risk. The plugin loads profiles slowly, respects Discord's limits and **never sends messages automatically**: the message button only opens the conversation.

## License

[GPL-3.0](LICENSE).
