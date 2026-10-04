/**
 * @name BadgesPlus
 * @author lirenzzzin
 * @authorLink https://github.com/lirenzzzin
 * @description Profile badges next to names (chat & member list) + search members by badge. / Badges do perfil ao lado do nome (chat e lista de membros) + pesquisa de membros por badge.
 * @version 1.0.0
 * @source https://github.com/lirenzzzin/BadgesPlus-BetterDiscord
 * @website https://github.com/lirenzzzin/BadgesPlus-BetterDiscord
 * @updateUrl https://raw.githubusercontent.com/lirenzzzin/BadgesPlus-BetterDiscord/main/BadgesPlus.plugin.js
 */

/*
 * BadgesPlus for BetterDiscord
 * Copyright (c) 2026 lirenzzzin
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Port of the Vencord/Vesktop version: https://github.com/lirenzzzin/BadgesPlus
 * Versão para BetterDiscord do plugin do Vencord/Vesktop.
 */

"use strict";

const PLUGIN = "BadgesPlus";
const Api = new BdApi(PLUGIN);
const { React, ReactDOM, Webpack, UI, Data, DOM, ReactUtils, Hooks, Components } = Api;
const h = React.createElement;

// =============================================================================
// Discord modules / Módulos do Discord
// =============================================================================

const lazy = getter => {
    let cache;
    return () => cache ??= getter();
};

const Stores = {
    get User() { return Webpack.getStore("UserStore"); },
    get UserProfile() { return Webpack.getStore("UserProfileStore"); },
    get GuildMember() { return Webpack.getStore("GuildMemberStore"); },
    get GuildMemberCount() { return Webpack.getStore("GuildMemberCountStore"); },
    get Guild() { return Webpack.getStore("GuildStore"); },
    get SelectedGuild() { return Webpack.getStore("SelectedGuildStore"); },
    get SelectedChannel() { return Webpack.getStore("SelectedChannelStore"); },
    get Locale() { return Webpack.getStore("LocaleStore"); },
};

const getDispatcher = lazy(() => Webpack.getModule(m =>
    typeof m?.dispatch === "function" && typeof m?.subscribe === "function" && (m._actionHandlers || m._subscriptions)
    && !m.dispatchToLastSubscribed, { searchExports: true }));
const getRestAPI = lazy(() => Webpack.getModule(m =>
    m && typeof m === "object" && typeof m.get === "function" && typeof m.del === "function" && typeof m.put === "function",
{ searchExports: true }));
const getProfileActions = lazy(() => Webpack.getByKeys("openUserProfileModal", "closeUserProfileModal"));
const getChannelActions = lazy(() => Webpack.getByKeys("openPrivateChannel"));
const getModalActions = lazy(() => Webpack.getMangled("?.stackNextByDefault", {
    closeModal: Webpack.Filters.byStrings(".setState", ".getState()[")
}));

// =============================================================================
// Settings / Configurações
// =============================================================================

const DEFAULTS = {
    language: "auto",
    showInChat: true,
    showInMemberList: true,
    showOnSelf: true,
    showOnBots: false,
    chatBadgeSize: 18,
    memberListBadgeSize: 16,
    badgeSpacing: 3,
    maxBadges: 0,
    showOverflowCount: true,
    badgeOrder: "discord",
    tooltipText: "label",
    showNitro: true,
    showBoost: true,
    showHypeSquad: true,
    showDiscordPrograms: true,
    showLegacyUsername: true,
    showQuests: true,
    showOther: true,
    fetchProfiles: true,
    loadSpeed: 500,
    fetchBotProfiles: false,
    showSearchButton: true,
    searchMatchMode: "all",
    searchAutoLoad: false,
    searchShowMessageButton: true,
    searchCloseOnMessage: true,
    searchIncludeBots: false,
    searchMaxResults: 300,
};

let settings = { ...DEFAULTS };
const settingsListeners = new Set();

function loadSettings() {
    settings = { ...DEFAULTS, ...(Data.load("settings") ?? {}) };
}

function setSetting(id, value) {
    settings = { ...settings, [id]: value };
    Data.save("settings", settings);
    if (id === "loadSpeed") setMinDelay(value);
    settingsListeners.forEach(l => l());
}

/** Re-renders when a setting changes / Re-renderiza quando uma configuração muda */
function useSettings() {
    const [, force] = React.useReducer(x => x + 1, 0);
    React.useEffect(() => {
        settingsListeners.add(force);
        return () => void settingsListeners.delete(force);
    }, []);
    return settings;
}

// =============================================================================
// i18n
// =============================================================================

function getLang() {
    if (settings.language === "en" || settings.language === "pt") return settings.language;
    return Stores.Locale?.locale?.toLowerCase().startsWith("pt") ? "pt" : "en";
}

/** t("English", "Português") */
const t = (en, pt) => getLang() === "pt" ? pt : en;

/** plural(3, "person", "people", "pessoa", "pessoas") -> "3 people" / "3 pessoas" */
const plural = (n, enOne, enMany, ptOne, ptMany) => `${n} ${n === 1 ? t(enOne, ptOne) : t(enMany, ptMany)}`;

// =============================================================================
// Badges
// =============================================================================

const badgeIconUrl = icon => `https://cdn.discordapp.com/badge-icons/${icon}.png`;

// Badges readable from public flags, without fetching the profile.
// Badges que dá pra descobrir pelas flags públicas, sem buscar o perfil.
const FLAG_BADGES = [
    { flag: 1 << 0, id: "staff", description: "Discord Staff", icon: "5e74e9b61934fc1f67c65515d1f7e60d" },
    { flag: 1 << 1, id: "partner", description: "Partnered Server Owner", icon: "3f9748e53446a137a052f3454e2de41e" },
    { flag: 1 << 18, id: "certified_moderator", description: "Moderator Programs Alumni", icon: "fee1624003e2fee35cb398e125dc479b" },
    { flag: 1 << 2, id: "hypesquad", description: "HypeSquad Events", icon: "bf01d1073931f921909045f3a39fd264" },
    { flag: 1 << 6, id: "hypesquad_house_1", description: "HypeSquad Bravery", icon: "8a88d63823d8a71cd5e390baa45efa02" },
    { flag: 1 << 7, id: "hypesquad_house_2", description: "HypeSquad Brilliance", icon: "011940fd013da3f7fb926e4a1cd2e618" },
    { flag: 1 << 8, id: "hypesquad_house_3", description: "HypeSquad Balance", icon: "3aa41de486fa12454c3761e8e223442e" },
    { flag: 1 << 3, id: "bug_hunter_level_1", description: "Discord Bug Hunter", icon: "2717692c7dca7289b35297368a940dd0" },
    { flag: 1 << 14, id: "bug_hunter_level_2", description: "Discord Bug Hunter", icon: "848f79194d4be5ff5f81505cbd0ce1e6" },
    { flag: 1 << 22, id: "active_developer", description: "Active Developer", icon: "6bdc42827a38498929a4920da12695d9" },
    { flag: 1 << 17, id: "verified_developer", description: "Early Verified Bot Developer", icon: "6df5892e0f35b051f8b61eace34f4967" },
    { flag: 1 << 9, id: "early_supporter", description: "Early Supporter", icon: "7060786766c9c840eb3019e725d2b358" },
];

const getFlagBadges = user => FLAG_BADGES.filter(b => ((user.publicFlags ?? 0) & b.flag) === b.flag);

const LABELS = {
    premium: ["Nitro", "Nitro"],
    staff: ["Discord Staff", "Funcionário do Discord"],
    partner: ["Partner", "Parceiro"],
    certified_moderator: ["Moderator Alumni", "Ex-moderador"],
    hypesquad: ["HypeSquad Events", "HypeSquad Eventos"],
    hypesquad_house_1: ["HypeSquad Bravery", "HypeSquad Bravery"],
    hypesquad_house_2: ["HypeSquad Brilliance", "HypeSquad Brilliance"],
    hypesquad_house_3: ["HypeSquad Balance", "HypeSquad Balance"],
    bug_hunter_level_1: ["Bug Hunter", "Caçador de Bugs"],
    bug_hunter_level_2: ["Bug Hunter Level 2", "Caçador de Bugs Nível 2"],
    active_developer: ["Active Developer", "Desenvolvedor Ativo"],
    verified_developer: ["Verified Bot Developer", "Dev de Bot Verificado"],
    early_supporter: ["Early Supporter", "Apoiador Inicial"],
    legacy_username: ["Originally known as", "Nome antigo"],
    quest_completed: ["Completed a Quest", "Missão concluída"],
    orb_profile_badge: ["Orbs", "Orbs"],
    bot_commands: ["Supports Commands", "Comandos de bot"],
    automod: ["AutoMod", "AutoMod"],
    application_guild_subscription: ["App subscription", "Assinatura de app"],
};

const TENURE = {
    1: ["Bronze", "Bronze"], 3: ["Silver", "Prata"], 6: ["Gold", "Ouro"], 12: ["Platinum", "Platina"],
    24: ["Diamond", "Diamante"], 36: ["Emerald", "Esmeralda"], 60: ["Ruby", "Rubi"], 72: ["Opal", "Opala"],
};
const BOOST_MONTHS = [0, 1, 2, 3, 6, 9, 12, 15, 18, 24];

const tenureMonths = id => Number(/^premium_tenure_(\d+)_month/.exec(id)?.[1] ?? NaN);
const boostLevel = id => Number(/^guild_booster_lvl(\d+)/.exec(id)?.[1] ?? NaN);

function getBadgeLabel(badge) {
    if (LABELS[badge.id]) return t(...LABELS[badge.id]);

    const months = tenureMonths(badge.id);
    if (!isNaN(months)) return `Nitro ${TENURE[months] ? t(...TENURE[months]) : plural(months, "month", "months", "mês", "meses")}`;

    const lvl = boostLevel(badge.id);
    if (!isNaN(lvl)) {
        const m = BOOST_MONTHS[lvl] ?? lvl;
        return `${t("Boost", "Impulso")} ${plural(m, "month", "months", "mês", "meses")}`;
    }

    return badge.description; // new badge: Discord's text / badge nova: texto do Discord
}

const getTooltip = badge => settings.tooltipText === "discord" ? badge.description : getBadgeLabel(badge);

const PROGRAMS = new Set(["staff", "partner", "certified_moderator", "bug_hunter_level_1", "bug_hunter_level_2", "active_developer", "verified_developer", "early_supporter"]);

function getCategory({ id }) {
    if (id === "premium" || id.startsWith("premium_tenure_")) return "nitro";
    if (id.startsWith("guild_booster_")) return "boost";
    if (id.startsWith("hypesquad")) return "hypesquad";
    if (PROGRAMS.has(id)) return "programs";
    if (id === "legacy_username") return "legacy";
    if (id.startsWith("quest") || id.startsWith("orb")) return "quests";
    return "other";
}

const CATEGORY_SETTING = {
    nitro: "showNitro", boost: "showBoost", hypesquad: "showHypeSquad", programs: "showDiscordPrograms",
    legacy: "showLegacyUsername", quests: "showQuests", other: "showOther",
};

const isNitroOrBoost = b => ["nitro", "boost"].includes(getCategory(b));

function filterAndSortBadges(badges) {
    const visible = badges.filter(b => settings[CATEGORY_SETTING[getCategory(b)]]);
    if (settings.badgeOrder === "nitroFirst") return [...visible.filter(isNitroOrBoost), ...visible.filter(b => !isNitroOrBoost(b))];
    if (settings.badgeOrder === "nitroLast") return [...visible.filter(b => !isNitroOrBoost(b)), ...visible.filter(isNitroOrBoost)];
    return visible;
}

function badgeSortRank(badge) {
    if (badge.id === "premium") return 0;
    const months = tenureMonths(badge.id);
    if (!isNaN(months)) return 1 + months / 1000;
    const lvl = boostLevel(badge.id);
    if (!isNaN(lvl)) return 2 + lvl / 100;
    return 3;
}

// =============================================================================
// Profile queue / Fila de perfis
// Adaptive speed: on a 429 it waits and slows down; after a streak of successes it speeds up.
// Velocidade adaptativa: num 429 espera e desacelera; após vários sucessos, acelera de novo.
// =============================================================================

const MAX_DELAY = 5000;
const SPEEDUP_AFTER = 15;
const queue = [];
const queued = new Set();
const failed = new Set();
const queueListeners = new Set();
let minDelay = 500;
let delay = minDelay;
let streak = 0;
let running = false;
let stopped = true;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const notifyQueue = () => queueListeners.forEach(l => l());

function setMinDelay(ms) {
    minDelay = ms;
    delay = Math.max(delay, ms);
}

const isDone = id => failed.has(id) || !!Stores.UserProfile?.getUserProfile(id);

async function fetchUserProfile(id) {
    const Dispatcher = getDispatcher();
    Dispatcher.dispatch({ type: "USER_PROFILE_FETCH_START", userId: id });
    const { body } = await getRestAPI().get({
        url: `/users/${id}/profile`,
        query: { with_mutual_guilds: false, with_mutual_friends_count: false },
        oldFormErrors: true,
    });
    Dispatcher.dispatch({ type: "USER_UPDATE", user: body.user });
    await Dispatcher.dispatch({ type: "USER_PROFILE_FETCH_SUCCESS", userProfile: body });
}

function queueProfiles(ids, front = false) {
    if (stopped) return;
    for (const id of ids) {
        if (isDone(id)) continue;
        if (queued.has(id)) {
            if (!front) continue;
            queue.splice(queue.indexOf(id), 1);
        }
        queued.add(id);
        front ? queue.unshift(id) : queue.push(id);
    }
    notifyQueue();
    if (!running) void runQueue();
}

function clearQueue() {
    queue.length = 0;
    queued.clear();
    notifyQueue();
}

async function runQueue() {
    running = true;
    try {
        while (queue.length && !stopped) {
            const id = queue.shift();
            queued.delete(id);
            if (isDone(id)) continue;

            try {
                await fetchUserProfile(id);
                if (++streak >= SPEEDUP_AFTER) {
                    streak = 0;
                    delay = Math.max(minDelay, Math.round(delay * 0.8));
                }
            } catch (e) {
                // so Discord doesn't think it's still loading / evita o Discord achar que ainda está carregando
                getDispatcher()?.dispatch({ type: "USER_PROFILE_FETCH_FAILURE", userId: id });
                streak = 0;

                if (e?.status === 429) {
                    const retryAfter = Number(e?.body?.retry_after) || 5;
                    delay = Math.min(MAX_DELAY, Math.round(delay * 1.5) + 250);
                    queued.add(id);
                    queue.unshift(id);
                    notifyQueue();
                    await sleep(retryAfter * 1000);
                    continue;
                }
                failed.add(id);
            }

            notifyQueue();
            await sleep(delay);
        }
    } finally {
        running = false;
        notifyQueue();
    }
}

// =============================================================================
// Components / Componentes
// =============================================================================

const Tooltip = Components.Tooltip;

function WithTooltip({ text, children }) {
    if (!Tooltip) return children({ title: text });
    return h(Tooltip, { text }, props => children(props));
}

function UserBadges({ user, where }) {
    const s = useSettings();

    const enabled = where === "chat" ? s.showInChat : s.showInMemberList;
    const allowed = enabled
        && (s.showOnBots || !user.bot)
        && (s.showOnSelf || user.id !== Stores.User.getCurrentUser()?.id);

    const profileBadges = Hooks.useStateFromStores(
        [Stores.UserProfile],
        () => Stores.UserProfile.getUserProfile(user.id)?.badges
    );

    React.useEffect(() => {
        if (!allowed || profileBadges || !s.fetchProfiles) return;
        if (user.bot && !s.fetchBotProfiles) return;
        queueProfiles([user.id], true); // whoever is on screen jumps the queue / quem está na tela passa na frente
    }, [user.id, allowed, profileBadges, s.fetchProfiles, s.fetchBotProfiles]);

    if (!allowed) return null;

    const all = filterAndSortBadges(profileBadges ?? getFlagBadges(user));
    if (!all.length) return null;

    const shown = s.maxBadges > 0 ? all.slice(0, s.maxBadges) : all;
    const hidden = all.slice(shown.length);
    const size = where === "chat" ? s.chatBadgeSize : s.memberListBadgeSize;

    return h("span", { className: "bp-badges", style: { gap: s.badgeSpacing } },
        shown.map(badge => h(WithTooltip, { key: badge.id, text: getTooltip(badge) }, props =>
            h("img", {
                ...props,
                className: "bp-badge",
                src: badgeIconUrl(badge.icon),
                alt: getBadgeLabel(badge),
                width: size,
                height: size,
                draggable: false,
            })
        )),
        hidden.length > 0 && s.showOverflowCount && h(WithTooltip, { text: hidden.map(getTooltip).join(", ") }, props =>
            h("span", { ...props, className: "bp-overflow", style: { fontSize: Math.max(10, size - 6) } }, `+${hidden.length}`)
        )
    );
}

/** Recomputes when profiles, members or the queue change / Recalcula quando perfis, membros ou a fila mudam */
function useGuildMembers(guildId, includeBots) {
    const [tick, setTick] = React.useState(0);

    React.useEffect(() => {
        let timer;
        const onChange = () => {
            clearTimeout(timer);
            timer = setTimeout(() => setTick(n => n + 1), 250);
        };
        Stores.UserProfile.addChangeListener(onChange);
        Stores.GuildMember.addChangeListener(onChange);
        queueListeners.add(onChange);
        return () => {
            clearTimeout(timer);
            Stores.UserProfile.removeChangeListener(onChange);
            Stores.GuildMember.removeChangeListener(onChange);
            queueListeners.delete(onChange);
        };
    }, []);

    return React.useMemo(() => {
        const entries = [];
        for (const id of Stores.GuildMember.getMemberIds(guildId)) {
            const user = Stores.User.getUser(id);
            if (!user || (user.bot && !includeBots)) continue;
            const profile = Stores.UserProfile.getUserProfile(id);
            entries.push({
                user,
                name: Stores.GuildMember.getNick(guildId, id) ?? user.globalName ?? user.username,
                badges: profile?.badges ?? getFlagBadges(user),
                done: isDone(id),
            });
        }
        return entries;
    }, [guildId, includeBots, tick]);
}

const MESSAGE_ICON = "M12 2.8C6.7 2.8 2.5 6.5 2.5 11.1c0 2.4 1.2 4.6 3.1 6.1-.2 1.4-.8 2.7-1.8 3.7-.2.2-.1.6.2.6 2.2 0 4-.8 5.3-1.8.9.2 1.8.3 2.7.3 5.3 0 9.5-3.7 9.5-8.3S17.3 2.8 12 2.8Z";

function openUserProfile(userId) {
    const guildId = Stores.SelectedGuild.getGuildId();
    getProfileActions()?.openUserProfileModal({
        userId,
        guildId,
        channelId: Stores.SelectedChannel.getChannelId(),
        analyticsLocation: { page: guildId ? "Guild Channel" : "DM Channel", section: "Profile Popout" },
    });
}

function SearchPanel({ guildId, close }) {
    const s = useSettings();
    const [selected, setSelected] = React.useState([]);

    const members = useGuildMembers(guildId, s.searchIncludeBots);
    const memberCount = Stores.GuildMemberCount?.getMemberCount(guildId);
    const myId = Stores.User.getCurrentUser()?.id;
    const missing = members.filter(m => !m.done);
    const pending = queue.length;

    const loadMissing = () => queueProfiles(missing.map(m => m.user.id));

    React.useEffect(() => {
        if (s.searchAutoLoad) loadMissing();
    }, []);

    const groups = React.useMemo(() => {
        const map = new Map();
        for (const m of members) {
            for (const b of m.badges) {
                const g = map.get(b.id);
                if (g) g.count++;
                else map.set(b.id, { badge: b, count: 1 });
            }
        }
        return [...map.values()].sort((a, b) => badgeSortRank(a.badge) - badgeSortRank(b.badge) || b.count - a.count);
    }, [members]);

    const results = React.useMemo(() => {
        if (!selected.length) return [];
        const has = (m, id) => m.badges.some(b => b.id === id);
        return members
            .filter(m => s.searchMatchMode === "any" ? selected.some(id => has(m, id)) : selected.every(id => has(m, id)))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [members, selected, s.searchMatchMode]);

    const toggle = id => setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);

    function sendMessage(userId) {
        if (s.searchCloseOnMessage) close();
        // Discord expects an object; passing just the ID creates an empty group DM.
        // O Discord espera um objeto; passar só o ID cria um grupo vazio.
        getChannelActions()?.openPrivateChannel({ recipientIds: [userId], navigateToChannel: true });
    }

    const guild = Stores.Guild.getGuild(guildId);
    const emptyText = s.searchMatchMode === "any"
        ? t("Nobody has any of the selected badges.", "Ninguém tem nenhuma das badges selecionadas.")
        : t("Nobody has all the selected badges.", "Ninguém tem todas as badges selecionadas.");
    const messageLabel = name => t(`Send a message to ${name}`, `Mandar mensagem para ${name}`);

    return h("div", { className: "bp-search" },
        guild && h("div", { className: "bp-search-guild" }, t(`in ${guild.name}`, `em ${guild.name}`)),

        h("div", { className: "bp-search-info" },
            h("span", null,
                plural(members.length, "member loaded", "members loaded", "membro carregado", "membros carregados"),
                memberCount ? t(` of ${memberCount}`, ` de ${memberCount}`) : "",
                " · ",
                t(`${members.length - missing.length} with full badges`, `${members.length - missing.length} com badges completas`)
            ),
            pending > 0
                ? h("span", null,
                    t(`Loading… ${pending} left`, `Carregando… ${pending} restantes`), " · ",
                    h("button", { className: "bp-link", onClick: clearQueue }, t("Stop", "Parar")))
                : missing.length > 0 && h("button", { className: "bp-link", onClick: loadMissing },
                    t(`Load badges of ${missing.length} members`, `Carregar badges de ${missing.length} membros`))
        ),

        groups.length > 0
            ? h("div", { className: "bp-chips" }, groups.map(({ badge, count }) => {
                const isSelected = selected.includes(badge.id);
                return h("button", {
                    key: badge.id,
                    className: "bp-chip" + (isSelected ? " bp-chip-selected" : ""),
                    "aria-pressed": isSelected,
                    onClick: () => toggle(badge.id),
                },
                h("img", { src: badgeIconUrl(badge.icon), width: 16, height: 16, alt: "" }),
                h("span", null, getBadgeLabel(badge)),
                h("span", { className: "bp-count" }, count));
            }))
            : h("div", { className: "bp-search-info" },
                t("No badges found yet. Load the members' badges above.", "Nenhuma badge encontrada ainda. Carregue as badges dos membros acima.")),

        selected.length > 0 && h("div", { className: "bp-results" },
            h("div", { className: "bp-search-info" },
                h("span", null, results.length === 0
                    ? emptyText
                    : plural(results.length, "person found", "people found", "pessoa encontrada", "pessoas encontradas")),
                h("button", { className: "bp-link", onClick: () => setSelected([]) }, t("Clear selection", "Limpar seleção"))
            ),
            results.slice(0, s.searchMaxResults).map(m => h("div", { key: m.user.id, className: "bp-row" },
                h("div", { className: "bp-person", onClick: () => openUserProfile(m.user.id) },
                    h("img", { className: "bp-avatar", src: m.user.getAvatarURL(guildId, 32), width: 32, height: 32, alt: "" }),
                    h("div", { className: "bp-names" },
                        h("span", { className: "bp-name" }, m.name),
                        h("span", { className: "bp-username" }, m.user.username))
                ),
                h("div", { className: "bp-row-badges" }, m.badges.map(b =>
                    h(WithTooltip, { key: b.id, text: getTooltip(b) }, props => h("img", {
                        ...props,
                        className: "bp-search-icon",
                        style: { opacity: selected.includes(b.id) ? 1 : 0.35 },
                        src: badgeIconUrl(b.icon),
                        width: 20,
                        height: 20,
                        alt: getBadgeLabel(b),
                        draggable: false,
                    }))
                )),
                s.searchShowMessageButton && m.user.id !== myId && !m.user.bot && h(WithTooltip, { text: messageLabel(m.name) }, props =>
                    h("button", {
                        ...props,
                        className: "bp-message",
                        "aria-label": messageLabel(m.name),
                        onClick: () => sendMessage(m.user.id),
                    }, h("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true }, h("path", { d: MESSAGE_ICON })))
                )
            )),
            results.length > s.searchMaxResults && h("div", { className: "bp-search-info" },
                t(`Showing the first ${s.searchMaxResults}.`, `Mostrando os primeiros ${s.searchMaxResults}.`))
        )
    );
}

function openSearch(guildId) {
    let key;
    const close = () => {
        try { getModalActions()?.closeModal(key); } catch { }
    };
    key = UI.showConfirmationModal(
        t("Search badges", "Pesquisar badges"),
        h(SearchPanel, { guildId, close }),
        { size: "bd-modal-medium", confirmText: t("Close", "Fechar"), cancelText: null }
    );
}

// =============================================================================
// DOM injection / Inserção na página
// BetterDiscord has no "decorations" API like Vencord, so badges are inserted into
// the page and the user is read from React's internal tree.
// O BetterDiscord não tem uma API de "decorações" como o Vencord, então as badges são
// inseridas na página e o usuário é lido da árvore interna do React.
// =============================================================================

const isUser = u => u && typeof u === "object" && typeof u.id === "string" && "username" in u;

/** Walks up React's tree from an element / Sobe pela árvore do React a partir de um elemento */
function findInFiber(el, pick, maxDepth = 40) {
    let fiber = ReactUtils.getInternalInstance(el);
    for (let i = 0; fiber && i < maxDepth; i++, fiber = fiber.return) {
        const found = pick(fiber.memoizedProps);
        if (found) return found;
    }
    return null;
}

const pickMessageAuthor = p => isUser(p?.message?.author) ? p.message.author : null;
const pickListUser = p => isUser(p?.user) ? p.user : null;

const roots = new Map(); // host element -> { root, userId }

function renderInto(host, user, where) {
    const entry = roots.get(host);
    if (entry?.userId === user.id) return;
    const root = entry?.root ?? ReactDOM.createRoot(host);
    root.render(h(Components.ErrorBoundary ?? React.Fragment, null, h(UserBadges, { user, where })));
    roots.set(host, { root, userId: user.id });
}

function makeHost() {
    const host = document.createElement("span");
    host.className = "bp-host";
    return host;
}

const NITRO_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
<path fill-rule="evenodd" d="M14.5 4.5a7.5 7.5 0 1 1 0 15a7.5 7.5 0 0 1 0-15Zm0 3.75a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5Z"/>
<rect x="1" y="7" width="5.5" height="2" rx="1"/><rect x="2.5" y="11" width="4" height="2" rx="1"/><rect x="1" y="15" width="5.5" height="2" rx="1"/></svg>`;

function injectSearchButton() {
    const guildId = Stores.SelectedGuild?.getGuildId();
    const toolbar = document.querySelector('[class*="upperContainer_"] [class*="toolbar_"]');
    const existing = document.querySelector(".bp-search-btn");

    if (!settings.showSearchButton || !guildId || !toolbar) {
        existing?.remove();
        return;
    }
    if (existing && toolbar.contains(existing) && existing.dataset.lang === getLang()) return;
    existing?.remove();

    // copies the look of the native buttons / copia o visual dos botões nativos
    const sample = toolbar.querySelector('[class*="iconWrapper_"]');
    const btn = document.createElement("div");
    btn.className = [...(sample?.classList ?? [])].filter(c => !c.includes("selected")).concat("bp-search-btn").join(" ");
    btn.dataset.lang = getLang();
    btn.setAttribute("role", "button");
    btn.tabIndex = 0;
    btn.setAttribute("aria-label", t("Search badges", "Pesquisar badges"));
    btn.innerHTML = NITRO_ICON;
    const iconClass = sample?.querySelector("svg")?.getAttribute("class");
    if (iconClass) btn.querySelector("svg").setAttribute("class", iconClass);
    btn.addEventListener("click", () => openSearch(Stores.SelectedGuild.getGuildId()));
    btn.addEventListener("keydown", e => { if (e.key === "Enter") openSearch(Stores.SelectedGuild.getGuildId()); });
    UI.createTooltip(btn, t("Search badges", "Pesquisar badges"), { side: "bottom" });
    toolbar.prepend(btn);
}

function scan() {
    // chat: Discord gives every message username an id="message-username-<id>"
    // chat: o Discord coloca id="message-username-<id>" em todo nome de mensagem
    for (const el of document.querySelectorAll('span[id^="message-username-"]')) {
        const user = findInFiber(el, pickMessageAuthor);
        if (!user) continue;
        let host = el.nextElementSibling;
        if (!host?.classList.contains("bp-host")) {
            host = makeHost();
            el.after(host);
        }
        renderInto(host, user, "chat");
    }

    // member list and DM list / lista de membros e de DMs
    for (const el of document.querySelectorAll('[class*="nameAndDecorators_"]')) {
        const user = findInFiber(el, pickListUser, 25);
        if (!user) continue;
        let host = el.querySelector(":scope > .bp-host");
        if (!host) {
            host = makeHost();
            el.appendChild(host);
        }
        renderInto(host, user, "list"); // lists reuse elements, so the user can change / listas reaproveitam elementos
    }

    injectSearchButton();

    // unmount badges whose element left the page / desmonta badges cujo elemento saiu da página
    for (const [host, { root }] of roots) {
        if (!host.isConnected) {
            roots.delete(host);
            setTimeout(() => root.unmount());
        }
    }
}

let scanScheduled = false;
let observer = null;

function scheduleScan() {
    if (scanScheduled) return;
    scanScheduled = true;
    setTimeout(() => {
        scanScheduled = false;
        try { scan(); } catch (e) { Api.Logger.error("scan failed", e); }
    }, 100);
}

// =============================================================================
// Settings panel / Painel de configurações
// =============================================================================

function buildSettingsPanel() {
    const sw = (id, name, note) => ({ type: "switch", id, name: t(...name), note: t(...note), value: settings[id] });
    const slider = (id, name, note, markers) => ({
        type: "slider", id, name: t(...name), note: t(...note), value: settings[id],
        min: markers[0], max: markers[markers.length - 1], markers, step: 1,
    });
    const dropdown = (id, name, note, options) => ({
        type: "dropdown", id, name: t(...name), note: t(...note), value: settings[id],
        options: options.map(([value, en, pt]) => ({ value, label: t(en, pt) })),
    });
    const category = (id, name, items) => ({ type: "category", id, name: t(...name), collapsible: true, shown: false, settings: items });

    return UI.buildSettingsPanel({
        onChange: (_category, id, value) => setSetting(id, value),
        settings: [
            {
                type: "dropdown", id: "language", name: "Language / Idioma", note: "Language of the plugin. / Idioma do plugin.",
                value: settings.language,
                options: [{ value: "auto", label: "Auto (Discord)" }, { value: "en", label: "English" }, { value: "pt", label: "Português" }],
            },
            category("where", ["Where to show", "Onde mostrar"], [
                sw("showInChat", ["Show in chat", "Mostrar no chat"], ["Shows badges right after the name in messages.", "Mostra as badges logo depois do nome nas mensagens."]),
                sw("showInMemberList", ["Show in member list", "Mostrar na lista de membros"], ["Shows badges right after the name in the member list (servers and DMs).", "Mostra as badges logo depois do nome na lista de membros (servidores e DMs)."]),
                sw("showOnSelf", ["Show my own badges", "Mostrar as minhas badges"], ["Also shows badges on your own account.", "Mostra as badges na sua própria conta também."]),
                sw("showOnBots", ["Show on bots", "Mostrar em bots"], ["Shows badges on bots (e.g. Supports Commands, AutoMod).", "Mostra badges em bots (ex.: Comandos de bot, AutoMod)."]),
            ]),
            category("appearance", ["Appearance", "Aparência"], [
                slider("chatBadgeSize", ["Size in chat", "Tamanho no chat"], ["Badge size in chat, in pixels.", "Tamanho das badges no chat, em pixels."], [12, 14, 16, 18, 20, 22, 24]),
                slider("memberListBadgeSize", ["Size in member list", "Tamanho na lista de membros"], ["Badge size in the member list, in pixels.", "Tamanho das badges na lista de membros, em pixels."], [12, 14, 16, 18, 20, 22, 24]),
                slider("badgeSpacing", ["Space between badges", "Espaço entre badges"], ["Space between one badge and the next, in pixels.", "Espaço entre uma badge e outra, em pixels."], [0, 1, 2, 3, 4, 6, 8]),
                slider("maxBadges", ["Max badges per person", "Máximo de badges por pessoa"], ["How many badges to show next to the name. 0 = all.", "Quantas badges mostrar ao lado do nome. 0 = todas."], [0, 1, 2, 3, 4, 5, 6, 8, 10]),
                sw("showOverflowCount", ["Show \"+N\" when over the limit", "Mostrar \"+N\" quando passar do máximo"], ["Shows how many badges were hidden by the limit above.", "Mostra quantas badges ficaram escondidas pelo limite acima."]),
                dropdown("badgeOrder", ["Badge order", "Ordem das badges"], ["In which order badges appear next to the name.", "Em que ordem as badges aparecem ao lado do nome."], [
                    ["discord", "Same as the Discord profile", "Igual ao perfil do Discord"],
                    ["nitroFirst", "Nitro and boost first", "Nitro e impulso primeiro"],
                    ["nitroLast", "Nitro and boost last", "Nitro e impulso por último"],
                ]),
                dropdown("tooltipText", ["Hover text", "Texto ao passar o mouse"], ["What shows up when you hover over a badge.", "O que aparece quando você passa o mouse em cima de uma badge."], [
                    ["label", "Short name (e.g. Nitro Opal)", "Nome curto (ex.: Nitro Opala)"],
                    ["discord", "Discord's text (e.g. Subscriber since...)", "Texto do Discord (ex.: Assinante desde...)"],
                ]),
            ]),
            category("which", ["Which badges", "Quais badges"], [
                sw("showNitro", ["Nitro badges", "Badges de Nitro"], ["Nitro and Nitro tiers (Bronze, Silver, Gold... Opal).", "Nitro e níveis de Nitro (Bronze, Prata, Ouro... Opala)."]),
                sw("showBoost", ["Boost badges", "Badges de impulso"], ["Server boost (1 month up to 24 months).", "Impulso de servidor (1 mês até 24 meses)."]),
                sw("showHypeSquad", ["HypeSquad badges", "Badges da HypeSquad"], ["Bravery, Brilliance, Balance and HypeSquad Events.", "Bravery, Brilliance, Balance e HypeSquad Eventos."]),
                sw("showDiscordPrograms", ["Discord program badges", "Badges de programas do Discord"], ["Staff, Partner, Bug Hunter, Moderator Alumni, Early Supporter, Active Developer, Verified Bot Developer.", "Funcionário, Parceiro, Caçador de Bugs, Ex-moderador, Apoiador Inicial, Desenvolvedor Ativo, Dev de Bot Verificado."]),
                sw("showLegacyUsername", ["\"Originally known as\" badge", "Badge \"Nome antigo\""], ["The badge for people who had a #tag name before the username change.", "A badge de quem tinha nome com #tag antes da mudança de nomes."]),
                sw("showQuests", ["Quest and Orbs badges", "Badges de missões e Orbs"], ["Completed a Quest, Orbs and similar.", "Missão concluída, Orbs e similares."]),
                sw("showOther", ["Other badges", "Outras badges"], ["Any badge that doesn't fit the categories above (including new Discord badges).", "Qualquer badge que não se encaixe nas categorias acima (inclusive badges novas do Discord)."]),
            ]),
            category("loading", ["Loading", "Carregamento"], [
                sw("fetchProfiles", ["Load profiles automatically", "Carregar perfis automaticamente"], ["Fetches the profile of whoever is on screen to find Nitro, boost and other badges that don't come with the user. Without it, only basic badges show up.", "Busca o perfil de quem aparece na tela para descobrir Nitro, impulso e outras badges que não vêm junto com o usuário. Sem isso, só aparecem as badges básicas."]),
                dropdown("loadSpeed", ["Loading speed", "Velocidade de carregamento"], ["Time between one profile and the next. If Discord asks to slow down, the plugin slows down by itself.", "Intervalo entre um perfil e outro. Se o Discord pedir para ir mais devagar, o plugin desacelera sozinho."], [
                    [500, "Fast (0.5s)", "Rápido (0,5s)"],
                    [1000, "Normal (1s)", "Normal (1s)"],
                    [2000, "Safe (2s)", "Seguro (2s)"],
                    [4000, "Very safe (4s)", "Muito seguro (4s)"],
                ]),
                sw("fetchBotProfiles", ["Load bot profiles", "Carregar perfil de bots"], ["Also fetches bot profiles. Leave off to save requests.", "Também busca o perfil de bots. Deixe desligado para economizar requisições."]),
            ]),
            category("search", ["Badge search", "Pesquisa de badges"], [
                sw("showSearchButton", ["Badge search button", "Botão de pesquisar badges"], ["Shows the Nitro button in the channel bar (next to pins and member list) to search members by badge.", "Mostra o botão de Nitro na barra do canal (perto de fixados e lista de membros) para pesquisar membros por badge."]),
                dropdown("searchMatchMode", ["With several badges selected, show who has...", "Com várias badges selecionadas, mostrar quem tem..."], ["How to combine the selected badges in the search.", "Como combinar as badges selecionadas no pesquisador."], [
                    ["all", "ALL selected badges", "TODAS as selecionadas"],
                    ["any", "ANY of the selected badges", "QUALQUER UMA das selecionadas"],
                ]),
                sw("searchAutoLoad", ["Load badges when opening the search", "Carregar badges ao abrir o pesquisador"], ["Starts loading every member's badges as soon as the search opens.", "Começa a carregar as badges de todos os membros assim que o pesquisador abre."]),
                sw("searchShowMessageButton", ["Message button in results", "Botão de mensagem nos resultados"], ["Shows the button that opens a DM with the person.", "Mostra o botão que abre a DM com a pessoa."]),
                sw("searchCloseOnMessage", ["Close the search when opening a DM", "Fechar o pesquisador ao abrir DM"], ["Closes the search when you click to send a message.", "Fecha o pesquisador quando você clica para mandar mensagem."]),
                sw("searchIncludeBots", ["Include bots in the search", "Incluir bots na pesquisa"], ["Shows bots in the results and in the badge counts.", "Mostra bots nos resultados e na contagem das badges."]),
                slider("searchMaxResults", ["Max results", "Máximo de resultados"], ["How many people to show at once in the search.", "Quantas pessoas mostrar de uma vez no pesquisador."], [50, 100, 200, 300, 500, 1000]),
            ]),
        ],
    });
}

// =============================================================================
// Styles / Estilos
// =============================================================================

const CSS = `
.bp-host { display: inline-flex; align-items: center; vertical-align: middle; }
.bp-badges { display: inline-flex; align-items: center; vertical-align: middle; margin-left: 4px; }
.bp-badge { display: block; object-fit: contain; flex-shrink: 0; }
.bp-overflow { color: var(--text-muted); font-weight: 600; line-height: 1; cursor: default; }

.bp-search { display: flex; flex-direction: column; gap: 12px; padding-bottom: 8px; max-height: 65vh; overflow-y: auto; }
.bp-search-guild { color: var(--text-muted); font-size: 14px; margin-top: -4px; }
.bp-search-info { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; font-size: 12px; color: var(--text-muted); }
.bp-link { background: none; border: none; padding: 0; font-size: 12px; color: var(--text-link); cursor: pointer; }
.bp-link:hover { text-decoration: underline; }
.bp-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.bp-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border: 1px solid var(--background-modifier-accent); border-radius: 999px; background: var(--background-secondary); color: var(--text-normal); font-size: 13px; cursor: pointer; }
.bp-chip:hover { background: var(--background-modifier-hover); }
.bp-chip-selected, .bp-chip-selected:hover { border-color: var(--green-360, #23a55a); box-shadow: 0 0 0 1px var(--green-360, #23a55a); background: color-mix(in srgb, var(--green-360, #23a55a) 15%, var(--background-secondary)); }
.bp-count { color: var(--text-muted); font-size: 12px; }
.bp-results { display: flex; flex-direction: column; gap: 2px; }
.bp-row { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 6px; }
.bp-row:hover { background: var(--background-modifier-hover); }
.bp-person { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; cursor: pointer; }
.bp-avatar { border-radius: 50%; flex-shrink: 0; }
.bp-names { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.bp-name { color: var(--text-normal); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bp-username { color: var(--text-muted); font-size: 12px; }
.bp-row-badges { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.bp-search-icon { display: block; object-fit: contain; }
.bp-message { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0; border: none; border-radius: 50%; background: var(--background-secondary); color: var(--interactive-normal); cursor: pointer; }
.bp-message:hover { background: var(--background-modifier-selected); color: var(--interactive-hover); }
`;

// =============================================================================
// Plugin
// =============================================================================

module.exports = class BadgesPlus {
    start() {
        loadSettings();
        stopped = false;
        setMinDelay(settings.loadSpeed);
        DOM.addStyle(CSS);

        this.onSettingsChange = () => scheduleScan();
        settingsListeners.add(this.onSettingsChange);

        observer = new MutationObserver(scheduleScan);
        observer.observe(document.body, { childList: true, subtree: true });
        scheduleScan();
    }

    stop() {
        stopped = true;
        clearQueue();
        observer?.disconnect();
        observer = null;
        settingsListeners.delete(this.onSettingsChange);
        DOM.removeStyle();

        for (const [host, { root }] of roots) {
            root.unmount();
            host.remove();
        }
        roots.clear();
        document.querySelectorAll(".bp-search-btn").forEach(el => el.remove());
    }

    getSettingsPanel() {
        return buildSettingsPanel();
    }
};
