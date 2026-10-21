import { logger } from '../utils/logger.js';

// =============================================================================
// HELPERS (env parsing + time constants)
// =============================================================================
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const SNOWFLAKE_REGEX = /^\d{17,20}$/;

/** Reads a comma-separated env var into a clean array of strings. */
const envList = (name) =>
  (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

/** Reads a boolean env var ("true", "1", "yes", "on" are truthy). */
const envBool = (name, defaultValue = false) => {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return defaultValue;
  return ["true", "1", "yes", "on"].includes(raw.trim().toLowerCase());
};

/** Reads an optional ID env var, returning null when unset/empty. */
const envId = (name) => process.env[name]?.trim() || null;

export const botConfig = {
  // =========================
  // BOT PRESENCE (what users see under the bot name)
  // =========================
  // `status` options:
  // - "online"    = green dot
  // - "idle"      = yellow moon
  // - "dnd"       = red do-not-disturb
  // - "invisible" = appears offline
  presence: {
    // Current online state shown on Discord (override with BOT_STATUS env var).
    status: process.env.BOT_STATUS || "online",

    // Activity lines shown under the bot name.
    // `type` number mapping from Discord:
    // 0 = Playing
    // 1 = Streaming
    // 2 = Listening
    // 3 = Watching
    // 4 = Custom
    // 5 = Competing
    activities: [
      {
        name: "Custom Status", // required by Discord API, not shown in the client
        state: process.env.BOT_STATUS_TEXT || "HOW TO DO COMMANDS", // this is what people actually see
        type: 2, // Custom
      },
    ],
  },

  // =========================
  // COMMAND BEHAVIOR
  // =========================
  commands: {
    // Bot owner user IDs (comma-separated in OWNER_IDS env var).
    // Owners can access owner/admin-level bot commands.
    owners: envList("OWNER_IDS"),

    // Default wait time between command uses (in seconds).
    defaultCooldown: 3,

    // If true, old commands are removed before re-registering.
    deleteCommands: false,

    // Optional server ID retained for tutorial compatibility; not used for command registration.
    testGuildId: process.env.TEST_GUILD_ID,

    // When true (or MAINTENANCE_MODE=true), only bot owners can run commands.
    maintenanceMode: envBool("MAINTENANCE_MODE"),

    // Command prefix for text-based commands (e.g., "!" for "!ping").
    // Supports both slash commands and prefix commands.
    prefix: process.env.PREFIX || "!",
  },

  // =========================
  // APPLICATIONS SYSTEM
  // =========================
  applications: {
    // Default questions shown when someone fills out an application.
    defaultQuestions: [
      { question: "What is your name?", required: true },
      { question: "How old are you?", required: true },
      { question: "Why do you want to join?", required: true },
    ],

    // Embed colors by application status.
    statusColors: {
      pending: "#FFA500",
      approved: "#00FF00",
      denied: "#FF0000",
    },

    // How long users must wait before submitting another application (hours).
    applicationCooldown: 24,

    // Auto-delete denied applications after this many days.
    deleteDeniedAfter: 7,

    // Auto-delete approved applications after this many days.
    deleteApprovedAfter: 30,

    // Role IDs allowed to manage applications (APPLICATION_MANAGER_ROLES env, comma-separated).
    managerRoles: envList("APPLICATION_MANAGER_ROLES"),
  },

  // =========================
  // EMBED COLORS & BRANDING
  // =========================
  // IMPORTANT: This is the SINGLE SOURCE OF TRUTH for all bot colors
  embeds: {
    colors: {
      // Main brand colors.
      primary: "#336699",
      secondary: "#2F3136",

      // Standard status colors for success/error/warning/info messages.
      success: "#57F287",
      error: "#ED4245",
      warning: "#FEE75C",
      info: "#3498DB",

      // Neutral utility colors.
      light: "#FFFFFF",
      dark: "#202225",
      gray: "#99AAB5",

      // Discord-style palette shortcuts.
      blurple: "#5865F2",
      green: "#57F287",
      yellow: "#FEE75C",
      fuchsia: "#EB459E",
      red: "#ED4245",
      black: "#000000",

      // Feature-specific colors.
      giveaway: {
        active: "#57F287",
        ended: "#ED4245",
      },
      ticket: {
        open: "#57F287",
        claimed: "#FAA61A",
        closed: "#ED4245",
        pending: "#99AAB5",
      },
      birthday: "#E91E63",
      moderation: "#9B59B6",

      // Ticket priority color mapping.
      priority: {
        none: "#95A5A6",
        low: "#3498DB",
        medium: "#2ECC71",
        high: "#F1C40F",
        urgent: "#E74C3C",
      },
    },
    footer: {
      // Default footer text used in bot embeds.
      text: "Titan Bot",
      // Footer icon URL (null = no icon).
      icon: null,
    },
    // Default thumbnail URL for embeds (null = no thumbnail).
    thumbnail: null,
    author: {
      // Optional default embed author block.
      name: null,
      icon: null,
      url: null,
    },
  },

  // =========================
  // TICKET SYSTEM
  // =========================
  tickets: {
    // Category ID where new tickets are created (null = no forced category).
    defaultCategory: envId("TICKET_CATEGORY_ID"),

    // Role IDs allowed to manage/support tickets (TICKET_SUPPORT_ROLES env, comma-separated).
    supportRoles: envList("TICKET_SUPPORT_ROLES"),

    // Priority options users/staff can assign.
    priorities: {
      none: { emoji: "⚪", color: "#95A5A6", label: "None" },
      low: { emoji: "🟢", color: "#2ECC71", label: "Low" },
      medium: { emoji: "🟡", color: "#F1C40F", label: "Medium" },
      high: { emoji: "🔴", color: "#E74C3C", label: "High" },
      urgent: { emoji: "🚨", color: "#E91E63", label: "Urgent" },
    },

    // Default priority for new tickets (must be a key of `priorities`).
    defaultPriority: "none",

    // Category ID where closed tickets are archived.
    archiveCategory: envId("TICKET_ARCHIVE_CATEGORY_ID"),

    // Channel ID where ticket logs are sent.
    logChannel: envId("TICKET_LOG_CHANNEL_ID"),
  },

  // =========================
  // GIVEAWAY SETTINGS
  // =========================
  giveaways: {
    // Default giveaway duration in milliseconds (24 hours).
    defaultDuration: DAY,

    // Allowed winner count range.
    minimumWinners: 1,
    maximumWinners: 10,

    // Allowed giveaway duration range in milliseconds.
    minimumDuration: 5 * MINUTE,
    maximumDuration: 30 * DAY,

    // Role IDs allowed to host giveaways (GIVEAWAY_ALLOWED_ROLES env).
    allowedRoles: envList("GIVEAWAY_ALLOWED_ROLES"),

    // Role IDs that bypass giveaway restrictions (GIVEAWAY_BYPASS_ROLES env).
    bypassRoles: envList("GIVEAWAY_BYPASS_ROLES"),
  },

  // =========================
  // BIRTHDAY SETTINGS
  // =========================
  birthday: {
    // Role ID given to users on their birthday.
    defaultRole: envId("BIRTHDAY_ROLE_ID"),

    // Channel ID where birthday announcements are posted.
    announcementChannel: envId("BIRTHDAY_CHANNEL_ID"),

    // Timezone used to calculate birthday dates (IANA name, e.g. "Europe/Amsterdam").
    timezone: process.env.BIRTHDAY_TIMEZONE || "UTC",
  },

  // =========================
  // VERIFICATION SETTINGS
  // =========================
  verification: {
    // Message shown when posting the verification panel.
    defaultMessage: "Click the button below to verify yourself and gain access to the server!",

    // Text on the verification button.
    defaultButtonText: "Verify",

    // Automatic verification behavior.
    autoVerify: {
      // How automatic verification decides who is auto-approved:
      // - "none"        = everyone is auto-verified immediately
      // - "account_age" = account must be older than set days
      // - "server_size" = auto-verify everyone only in smaller servers
      defaultCriteria: "none",

      // Days used when `defaultCriteria` is `account_age`.
      defaultAccountAgeDays: 7,

      // Member count threshold used when `defaultCriteria` is `server_size`.
      // Example: 1000 means auto-verify if server has fewer than 1000 members.
      serverSizeThreshold: 1000,

      // Allowed safety limits for account-age requirements.
      minAccountAge: 1,
      maxAccountAge: 365,

      // If true, user receives a DM after verification.
      sendDMNotification: true,

      // Human-readable descriptions for each criteria mode.
      criteria: {
        account_age: "Account must be older than specified days",
        server_size: "All users if server has less than 1000 members",
        none: "All users immediately",
      },
    },

    // Minimum time between verification attempts (milliseconds).
    verificationCooldown: 5 * SECOND,

    // Maximum failed attempts allowed inside the time window below.
    maxVerificationAttempts: 3,

    // Time window for counting attempts (milliseconds).
    attemptWindow: MINUTE,

    // In-memory safety limits (helps avoid unbounded memory growth).
    maxCooldownEntries: 10000,
    maxAttemptEntries: 10000,
    // Cleanup frequency for cooldown/attempt maps (milliseconds).
    cooldownCleanupInterval: 5 * MINUTE,
    // Maximum metadata payload size for audit entries (bytes).
    maxAuditMetadataBytes: 4096,
    // Maximum number of audit entries kept in memory.
    maxInMemoryAuditEntries: 1000,
    // If true, log every verification action.
    logAllVerifications: true,
    // If true, preserve verification audit history.
    keepAuditTrail: true,
  },

  // =========================
  // WELCOME / GOODBYE MESSAGES
  // =========================
  welcome: {
    // Welcome template posted when a user joins.
    // Placeholders: {user}, {server}, {memberCount}
    defaultWelcomeMessage:
      "Welcome {user} to {server}! We now have {memberCount} members!",
    // Goodbye template posted when a user leaves.
    // Placeholders: {user}, {memberCount}
    defaultGoodbyeMessage:
      "{user} has left the server. We now have {memberCount} members.",
    // Channel ID for welcome messages.
    defaultWelcomeChannel: envId("WELCOME_CHANNEL_ID"),
    // Channel ID for goodbye messages.
    defaultGoodbyeChannel: envId("GOODBYE_CHANNEL_ID"),
  },

  // =========================
  // COUNTER CHANNELS
  // =========================
  counters: {
    defaults: {
      // Default naming/description templates for counter entries.
      name: "{name} Counter",
      description: "Server {name} counter",
      // Channel type used for counters (typically "voice").
      type: "voice",
      // Channel name format. `{count}` is replaced automatically.
      channelName: "{name}-{count}",
    },
    permissions: {
      // Default denied permissions for the counter channel.
      // NOTE: discord.js v14 uses PascalCase flag names ("ViewChannel"); these
      // legacy names are kept for compatibility with existing counter code.
      deny: ["VIEW_CHANNEL"],
      // Default allowed permissions for the counter channel.
      allow: ["VIEW_CHANNEL", "CONNECT", "SPEAK"],
    },
    messages: {
      // Default response messages for counter actions.
      created: "✅ Created counter **{name}**",
      deleted: "🗑️ Deleted counter **{name}**",
      updated: "🔄 Updated counter **{name}**",
    },
    types: {
      // Built-in counter types and how each count is calculated.
      // Note: bots/humans rely on the member cache; fetch members first for exact numbers.
      members: {
        name: "👥 Members",
        description: "Total members in the server",
        getCount: (guild) => String(guild.memberCount),
      },
      bots: {
        name: "🤖 Bots",
        description: "Total bot accounts in the server",
        getCount: (guild) =>
          String(guild.members.cache.filter((m) => m.user.bot).size),
      },
      members_only: {
        name: "👤 Humans",
        description: "Total human members (non-bots)",
        getCount: (guild) =>
          String(guild.members.cache.filter((m) => !m.user.bot).size),
      },
    },
  },

  // =========================
  // GENERIC BOT MESSAGES
  // =========================
  messages: {
    noPermission: "You do not have permission to use this command.",
    cooldownActive: "Please wait {time} before using this command again.",
    errorOccurred: "An error occurred while executing this command.",
    missingPermissions:
      "I am missing required permissions to perform this action.",
    commandDisabled: "This command has been disabled.",
    maintenanceMode: "The bot is currently in maintenance mode.",
  },

  // =========================
  // FEATURE TOGGLES
  // =========================
  // Set any feature to `false` to disable it globally.
  features: {
    // Core systems.
    economy: false, // economy removed; keeps any leftover economy commands disabled
    leveling: true,
    moderation: true,
    logging: true,
    welcome: true,

    // Community engagement systems.
    tickets: true,
    giveaways: true,
    birthday: true,
    counter: true,

    // Security and self-service systems.
    verification: true,
    reactionRoles: true,
    joinToCreate: true,

    // Utility/quality-of-life modules.
    voice: true,
    search: true,
    tools: true,
    utility: true,
    community: true,
    fun: true,
    music: true,
  },
};

// =============================================================================
// VALIDATION
// =============================================================================
const VALID_STATUSES = ["online", "idle", "dnd", "invisible"];

/**
 * Validates environment variables and config sanity.
 * Returns an array of human-readable error strings (empty = valid).
 */
export function validateConfig(config = botConfig) {
  const errors = [];

  // --- Debug output (booleans only, never secret values) ---
  if (process.env.NODE_ENV !== "production") {
    logger.debug("Environment variables check:");
    logger.debug("DISCORD_TOKEN exists:", !!process.env.DISCORD_TOKEN);
    logger.debug("TOKEN exists:", !!process.env.TOKEN);
    logger.debug("CLIENT_ID exists:", !!process.env.CLIENT_ID);
    logger.debug("GUILD_ID exists:", !!process.env.GUILD_ID);
    logger.debug("POSTGRES_HOST exists:", !!process.env.POSTGRES_HOST);
    logger.debug("NODE_ENV:", process.env.NODE_ENV);
  }

  // --- Required environment ---
  if (!process.env.DISCORD_TOKEN && !process.env.TOKEN) {
    errors.push("Bot token is required (DISCORD_TOKEN or TOKEN environment variable)");
  }

  if (!process.env.CLIENT_ID) {
    errors.push("Client ID is required (CLIENT_ID environment variable)");
  }

  if (process.env.NODE_ENV === "production") {
    // A full connection URL (DATABASE_URL / POSTGRES_URL) satisfies all Postgres
    // requirements, matching how src/config/database/postgres.js resolves the pool config.
    const hasConnectionUrl = Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);

    if (!hasConnectionUrl) {
      if (!process.env.POSTGRES_HOST) {
        errors.push("PostgreSQL connection is required in production (set DATABASE_URL/POSTGRES_URL, or POSTGRES_HOST)");
      }
      if (!process.env.POSTGRES_USER) {
        errors.push("PostgreSQL user is required in production (set DATABASE_URL/POSTGRES_URL, or POSTGRES_USER)");
      }
      if (!process.env.POSTGRES_PASSWORD) {
        errors.push("PostgreSQL password is required in production (set DATABASE_URL/POSTGRES_URL, or POSTGRES_PASSWORD)");
      }
    }
  }

  // --- Config sanity checks ---
  if (!VALID_STATUSES.includes(config.presence?.status)) {
    errors.push(`presence.status must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  if (!config.commands?.prefix || /\s/.test(config.commands.prefix)) {
    errors.push("commands.prefix must be a non-empty string without whitespace");
  }

  const invalidOwners = (config.commands?.owners ?? []).filter((id) => !SNOWFLAKE_REGEX.test(id));
  if (invalidOwners.length > 0) {
    errors.push(`OWNER_IDS contains invalid Discord IDs: ${invalidOwners.join(", ")}`);
  }

  const gw = config.giveaways ?? {};
  if (gw.minimumWinners > gw.maximumWinners) {
    errors.push("giveaways.minimumWinners must be <= giveaways.maximumWinners");
  }
  if (gw.minimumDuration > gw.maximumDuration) {
    errors.push("giveaways.minimumDuration must be <= giveaways.maximumDuration");
  }
  if (gw.defaultDuration < gw.minimumDuration || gw.defaultDuration > gw.maximumDuration) {
    errors.push("giveaways.defaultDuration must be within the min/max duration range");
  }

  if (!config.tickets?.priorities?.[config.tickets?.defaultPriority]) {
    errors.push("tickets.defaultPriority must match a key in tickets.priorities");
  }

  const timezone = config.birthday?.timezone;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    errors.push(`birthday.timezone "${timezone}" is not a valid IANA timezone`);
  }

  return errors;
}

const configErrors = validateConfig(botConfig);
if (configErrors.length > 0) {
  logger.error("Bot configuration errors:", configErrors.join("\n"));
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

export const BotConfig = botConfig;

// =============================================================================
// COMMAND CATEGORY -> FEATURE TOGGLE MAP
// =============================================================================
const COMMAND_CATEGORY_FEATURE_MAP = {
  birthday: "birthday",
  community: "community",
  economy: "economy",
  fun: "fun",
  giveaway: "giveaways",
  jointocreate: "joinToCreate",
  leveling: "leveling",
  logging: "logging",
  moderation: "moderation",
  music: "music",
  reaction_roles: "reactionRoles",
  search: "search",
  serverstats: "counter",
  ticket: "tickets",
  tools: "tools",
  utility: "utility",
  verification: "verification",
  welcome: "welcome",
};

function normalizeCategoryKey(category) {
  return String(category || "").trim().toLowerCase().replace(/\s+/g, "_");
}

// =============================================================================
// PUBLIC HELPERS
// =============================================================================
export function getCommandPrefix() {
  return botConfig.commands?.prefix ?? "!";
}

export function getBotOwners() {
  return (botConfig.commands?.owners ?? [])
    .map((id) => String(id).trim())
    .filter(Boolean);
}

export function isBotOwner(userId) {
  if (!userId) return false;
  return getBotOwners().includes(String(userId));
}

export function isMaintenanceMode() {
  return botConfig.commands?.maintenanceMode === true;
}

/**
 * Returns a configured message with {placeholders} filled in.
 * Unknown placeholders are left untouched; unknown keys return the key itself.
 */
export function getBotMessage(key, replacements = {}) {
  const template = botConfig.messages?.[key] ?? key;

  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(replacements, name)
      ? String(replacements[name])
      : match,
  );
}

export function isFeatureEnabled(featureKey) {
  if (!featureKey) return true;
  return botConfig.features?.[featureKey] !== false;
}

export function isCommandCategoryEnabled(category) {
  const normalized = normalizeCategoryKey(category);

  if (!normalized || normalized === "core") return true;

  const featureKey = COMMAND_CATEGORY_FEATURE_MAP[normalized];
  if (!featureKey) return true;

  return isFeatureEnabled(featureKey);
}

/** Converts "#RRGGBB" (or a 0xRRGGBB number) to an integer color, or null if invalid. */
function toColorInt(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)) {
    return parseInt(value.slice(1), 16);
  }
  return null;
}

/**
 * Resolves a color to a Discord-ready integer.
 * Accepts a number, a "#RRGGBB" hex string, or a dot path into embeds.colors
 * (e.g. "success", "ticket.open"). Falls back to `fallback` if it can't resolve.
 */
export function getColor(path, fallback = "#99AAB5") {
  const direct = toColorInt(path);
  if (direct !== null) return direct;

  const resolved = String(path ?? "")
    .split(".")
    .reduce((obj, key) => (obj && typeof obj === "object" ? obj[key] : undefined), botConfig.embeds.colors);

  return toColorInt(resolved) ?? toColorInt(fallback) ?? 0x99aab5;
}

export function getApplicationStatusColor(status) {
  const hex = botConfig.applications?.statusColors?.[status];
  if (hex) return getColor(hex);

  return getColor(status === "approved" ? "success" : status === "denied" ? "error" : "warning");
}

export function getDefaultApplicationQuestions() {
  return (botConfig.applications?.defaultQuestions || [])
    .map((entry) => (typeof entry === "string" ? entry : entry.question))
    .filter(Boolean);
}

/** Recursively collects every hex color in the palette. */
function collectColors(node) {
  if (typeof node === "string") return [node];
  if (node && typeof node === "object") return Object.values(node).flatMap(collectColors);
  return [];
}

/** Returns a random palette color as a Discord-ready integer. */
export function getRandomColor() {
  const colors = collectColors(botConfig.embeds.colors);
  return getColor(colors[Math.floor(Math.random() * colors.length)]);
}

export default botConfig;
