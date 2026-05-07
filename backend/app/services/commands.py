import re
from dataclasses import dataclass

ALLOWED_COMMANDS = {
    "move_forward", "move_back", "turn_left", "turn_right",
    "pick_up", "put_down", "wave", "dance", "sleep", "wake",
    "scan", "charge", "report",
}

COMMAND_LABELS = {
    "move_forward": "Moving Forward",
    "move_back": "Moving Backward",
    "turn_left": "Turning Left",
    "turn_right": "Turning Right",
    "pick_up": "Picking Up Object",
    "put_down": "Putting Down Object",
    "wave": "Waving",
    "dance": "Dancing",
    "sleep": "Entering Sleep Mode",
    "wake": "Waking Up",
    "scan": "Scanning Environment",
    "charge": "Initiating Charge",
    "report": "Generating Report",
}

_PATTERN = re.compile(r"\[\[cmd:([a-z_]+)\]\]")


@dataclass
class Command:
    name: str
    label: str


def extract_commands(text: str) -> tuple[str, list[Command]]:
    """Strip [[cmd:...]] tags from text, returning clean text and parsed commands."""
    commands: list[Command] = []

    def _replace(m: re.Match) -> str:
        name = m.group(1)
        if name in ALLOWED_COMMANDS:
            commands.append(Command(name=name, label=COMMAND_LABELS.get(name, name)))
        return ""

    clean = _PATTERN.sub(_replace, text)
    clean = re.sub(r" {2,}", " ", clean).strip()
    clean = re.sub(r"\n{3,}", "\n\n", clean)
    return clean, commands


def process_buffer(buf: str, *, partial: bool) -> tuple[str, str, list[Command]]:
    """
    Split a streaming buffer into safe-to-emit text and remaining buffer.

    With partial=True, holds back text that could be the start of an incomplete
    [[cmd:...]] tag. With partial=False, flushes everything.

    Returns (remaining_buf, emitted_text, commands).
    """
    emitted = ""
    commands: list[Command] = []

    while buf:
        open_idx = buf.find("[[")

        if open_idx == -1:
            if partial:
                # Hold any tail chars that could be the start of "[["
                for tail_len in range(min(2, len(buf)), 0, -1):
                    if "[[".startswith(buf[-tail_len:]):
                        emitted += buf[:-tail_len]
                        buf = buf[-tail_len:]
                        return buf, emitted, commands
            emitted += buf
            buf = ""
            break

        # Emit text before "[["
        if open_idx > 0:
            emitted += buf[:open_idx]
            buf = buf[open_idx:]

        # buf starts with "[["
        close_idx = buf.find("]]")
        if close_idx == -1:
            if not partial:
                # Force-flush as plain text on final call
                emitted += buf
                buf = ""
            break  # Incomplete tag — wait for more data

        tag = buf[: close_idx + 2]
        clean_tag, tag_cmds = extract_commands(tag)
        if clean_tag:
            emitted += clean_tag
        commands.extend(tag_cmds)
        buf = buf[close_idx + 2:]

    return buf, emitted, commands
