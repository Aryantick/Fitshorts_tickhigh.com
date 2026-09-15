#!/usr/bin/env node

/**
 * Telecom API Log Inspector CLI Tool
 * 
 * Examples:
 *   npm run logs -- --client=obf
 *   npm run logs -- --client=obf --time=10:00-11:00
 *   npm run logs -- --client=obf --msisdn=22670123456
 *   npm run logs -- --date=2026-09-11 --last=5
 *   npm run logs -- --tail
 *   npm run logs -- --curl-only
 */

const fs = require("fs");
const path = require("path");

const LOGS_BASE_DIR = path.resolve(__dirname, "../logs/telecom");

// ANSI Color Codes for terminal
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    client: "all",
    date: getTodayString(),
    timeRange: null, // "10:00-11:00"
    fromTime: null,
    toTime: null,
    msisdn: null,
    action: null,
    errorOnly: false,
    curlOnly: false,
    last: null,
    tail: false,
    help: false,
  };

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--tail" || arg === "-f") {
      options.tail = true;
    } else if (arg === "--errors" || arg === "--error-only") {
      options.errorOnly = true;
    } else if (arg === "--curl-only") {
      options.curlOnly = true;
    } else if (arg.startsWith("--client=")) {
      options.client = arg.split("=")[1].toLowerCase().trim();
    } else if (arg.startsWith("--date=")) {
      options.date = arg.split("=")[1].trim();
    } else if (arg.startsWith("--time=")) {
      options.timeRange = arg.split("=")[1].trim();
    } else if (arg.startsWith("--from=")) {
      options.fromTime = arg.split("=")[1].trim();
    } else if (arg.startsWith("--to=")) {
      options.toTime = arg.split("=")[1].trim();
    } else if (arg.startsWith("--msisdn=")) {
      options.msisdn = arg.split("=")[1].trim();
    } else if (arg.startsWith("--action=")) {
      options.action = arg.split("=")[1].trim();
    } else if (arg.startsWith("--last=")) {
      options.last = parseInt(arg.split("=")[1].trim(), 10);
    }
  }

  if (options.timeRange && options.timeRange.includes("-")) {
    const [from, to] = options.timeRange.split("-");
    options.fromTime = from.trim();
    options.toTime = to.trim();
  }

  return options;
}

function getTodayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function printHelp() {
  console.log(`
${C.bold}${C.cyan}Telecom API Log Inspector CLI Tool${C.reset}
Usage:
  npm run logs -- [options]

${C.bold}Options:${C.reset}
  ${C.green}--client=<name>${C.reset}     Client folder: obf, dialogsl, backreel, or all (default: all)
  ${C.green}--date=<YYYY-MM-DD>${C.reset} Log date (default: today's date)
  ${C.green}--time=<from-to>${C.reset}    Time range filter in 24h format (e.g. --time=10:00-11:00)
  ${C.green}--msisdn=<number>${C.reset}   Filter by user phone number or identifier
  ${C.green}--action=<action>${C.reset}   Filter by action (e.g. checkSub, sendOtp, validateOtp)
  ${C.green}--errors${C.reset}            Show only failed / error requests
  ${C.green}--last=<N>${C.reset}           Show only the last N matching log entries
  ${C.green}--curl-only${C.reset}        Show only the executable cURL commands
  ${C.green}--tail${C.reset}             Stream logs live in real time
  ${C.green}--help${C.reset}             Show this help menu

${C.bold}Examples:${C.reset}
  ${C.yellow}npm run logs -- --client=obf --time=10:00-11:00${C.reset}    (Check Orange logs between 10:00 and 11:00)
  ${C.yellow}npm run logs -- --client=obf --msisdn=22670123456${C.reset}  (Check logs for specific MSISDN)
  ${C.yellow}npm run logs -- --errors${C.reset}                           (Check all errors across clients today)
  ${C.yellow}npm run logs -- --client=obf --last=5${C.reset}              (Check last 5 Orange requests)
  ${C.yellow}npm run logs -- --tail${C.reset}                            (Live tail logs as requests happen)
`);
}

/**
 * Split raw log file into individual log entry blocks
 */
function parseLogFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const rawContent = fs.readFileSync(filePath, "utf8");
  if (!rawContent.trim()) {
    return [];
  }

  // Each log block is bounded by lines of '='
  const separator = "=".repeat(80);
  const rawBlocks = rawContent.split(separator);

  const entries = [];
  for (const block of rawBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Extract timestamp: [YYYY-MM-DD HH:mm:ss]
    const timeMatch = trimmed.match(/\[(\d{4}-\d{2}-\d{2}\s+(\d{2}):(\d{2}):(\d{2}))\]/);
    const msisdnMatch = trimmed.match(/MSISDN:\s*([^\s|]+)/);
    const clientMatch = trimmed.match(/Client:\s*([^\s(]+)/);
    const actionMatch = trimmed.match(/Action:\s*([^\s|]+)/);
    const isError = trimmed.includes("[ERROR]") || trimmed.includes("ERROR [");

    // Extract cURL command
    const curlMatch = trimmed.match(/REQUEST \(cURL\):\s*\n([\s\S]*?)(?=\n\n(?:RESPONSE|ERROR))/);
    const curl = curlMatch ? curlMatch[1].trim() : "";

    entries.push({
      raw: `${separator}\n${trimmed}\n${separator}`,
      timestampStr: timeMatch ? timeMatch[1] : "",
      hour: timeMatch ? parseInt(timeMatch[2], 10) : 0,
      minute: timeMatch ? parseInt(timeMatch[3], 10) : 0,
      timeHHMM: timeMatch ? `${timeMatch[2]}:${timeMatch[3]}` : "",
      msisdn: msisdnMatch ? msisdnMatch[1] : "",
      client: clientMatch ? clientMatch[1] : "",
      action: actionMatch ? actionMatch[1] : "",
      isError,
      curl,
    });
  }

  return entries;
}

/**
 * Filter entries according to options
 */
function filterEntries(entries, options) {
  return entries.filter((entry) => {
    // 1. Time range filter (e.g. 10:00 to 11:00)
    if (options.fromTime && entry.timeHHMM) {
      if (entry.timeHHMM < options.fromTime) return false;
    }
    if (options.toTime && entry.timeHHMM) {
      if (entry.timeHHMM > options.toTime) return false;
    }

    // 2. MSISDN filter
    if (options.msisdn && !entry.msisdn.toLowerCase().includes(options.msisdn.toLowerCase())) {
      return false;
    }

    // 3. Action filter
    if (options.action && !entry.action.toLowerCase().includes(options.action.toLowerCase())) {
      return false;
    }

    // 4. Error-only filter
    if (options.errorOnly && !entry.isError) {
      return false;
    }

    return true;
  });
}

/**
 * Format entry for terminal output
 */
function formatTerminalEntry(entry, options) {
  if (options.curlOnly) {
    if (!entry.curl) return "";
    return `${C.cyan}# [${entry.timestampStr}] ${entry.client} - ${entry.action} (${entry.msisdn})${C.reset}\n${C.yellow}${entry.curl}${C.reset}\n`;
  }

  // Highlight blocks nicely
  let formatted = entry.raw;
  // Color headers
  formatted = formatted.replace(/\[\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\]/g, (m) => `${C.magenta}${m}${C.reset}`);
  formatted = formatted.replace(/REQUEST \(cURL\):/g, `${C.bold}${C.yellow}REQUEST (cURL):${C.reset}`);
  formatted = formatted.replace(/RESPONSE \[200 OK\]/g, `${C.bold}${C.green}RESPONSE [200 OK]${C.reset}`);
  formatted = formatted.replace(/ERROR \[.*?\]/g, (m) => `${C.bold}${C.red}${m}${C.reset}`);
  formatted = formatted.replace(/\[ERROR\]/g, `${C.bold}${C.red}[ERROR]${C.reset}`);

  return formatted;
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    return;
  }

  const logFile = `${options.date}.log`;
  const targetDir = path.join(LOGS_BASE_DIR, options.client);
  const targetPath = path.join(targetDir, logFile);

  console.log(`${C.cyan}${C.bold}🔍 Checking Telecom Logs...${C.reset}`);
  console.log(`${C.gray}   Client : ${C.white}${options.client}${C.reset}`);
  console.log(`${C.gray}   Date   : ${C.white}${options.date}${C.reset}`);
  if (options.fromTime || options.toTime) {
    console.log(`${C.gray}   Time   : ${C.yellow}${options.fromTime || "00:00"} to ${options.toTime || "23:59"}${C.reset}`);
  }
  if (options.msisdn) {
    console.log(`${C.gray}   MSISDN : ${C.yellow}${options.msisdn}${C.reset}`);
  }
  if (options.errorOnly) {
    console.log(`${C.gray}   Filter : ${C.red}Errors Only${C.reset}`);
  }
  console.log(`${C.gray}   File   : ${C.dim}${targetPath}${C.reset}\n`);

  if (!fs.existsSync(targetPath)) {
    console.log(`${C.yellow}No logs found for ${options.date} under client '${options.client}'.${C.reset}`);
    console.log(`${C.gray}Make an API request to generate logs, or check available dates using 'ls backend/logs/telecom/${options.client}'${C.reset}`);
    return;
  }

  // Handle live tailing
  if (options.tail) {
    console.log(`${C.green}🟢 Live streaming logs (Press Ctrl+C to exit)...${C.reset}\n`);
    let lastSize = fs.statSync(targetPath).size;

    fs.watchFile(targetPath, { interval: 500 }, () => {
      const currentSize = fs.statSync(targetPath).size;
      if (currentSize > lastSize) {
        const stream = fs.createReadStream(targetPath, {
          start: lastSize,
          end: currentSize,
          encoding: "utf8",
        });
        stream.on("data", (chunk) => {
          process.stdout.write(chunk);
        });
        lastSize = currentSize;
      }
    });
    return;
  }

  // Read and filter entries
  const allEntries = parseLogFile(targetPath);
  let matched = filterEntries(allEntries, options);

  if (options.last && options.last > 0) {
    matched = matched.slice(-options.last);
  }

  if (matched.length === 0) {
    console.log(`${C.yellow}No matching log entries found for the specified filters.${C.reset}`);
    console.log(`${C.gray}(Total entries in file: ${allEntries.length})${C.reset}`);
    return;
  }

  console.log(`${C.green}Found ${matched.length} matching log entries:${C.reset}\n`);

  for (const entry of matched) {
    console.log(formatTerminalEntry(entry, options));
    console.log("");
  }
}

main().catch((err) => {
  console.error("Error checking logs:", err.message);
});
