from app.services.commands import extract_commands, process_buffer


def test_no_commands():
    text = "Hello, I am a robot."
    clean, cmds = extract_commands(text)
    assert clean == text
    assert cmds == []


def test_single_command_stripped():
    text = "Nice to meet you! [[cmd:wave]] I am ready."
    clean, cmds = extract_commands(text)
    assert "[[cmd:wave]]" not in clean
    assert clean == "Nice to meet you! I am ready."
    assert len(cmds) == 1
    assert cmds[0].name == "wave"
    assert cmds[0].label == "Waving"


def test_multiple_commands():
    text = "[[cmd:move_forward]] Going! [[cmd:turn_left]] Turning now."
    clean, cmds = extract_commands(text)
    assert len(cmds) == 2
    assert cmds[0].name == "move_forward"
    assert cmds[1].name == "turn_left"
    assert "[[cmd:" not in clean


def test_unknown_command_ignored():
    text = "[[cmd:self_destruct]] Boom."
    clean, cmds = extract_commands(text)
    assert cmds == []
    assert "[[cmd:self_destruct]]" not in clean


def test_process_buffer_partial_holds_open_tag():
    buf = "Hello [[cmd:wa"
    remaining, emitted, cmds = process_buffer(buf, partial=True)
    assert emitted == "Hello "
    assert "[[cmd:wa" in remaining
    assert cmds == []


def test_process_buffer_partial_emits_complete_command():
    buf = "Hi [[cmd:wave]] there"
    remaining, emitted, cmds = process_buffer(buf, partial=True)
    assert remaining == ""
    assert emitted == "Hi  there"
    assert len(cmds) == 1
    assert cmds[0].name == "wave"


def test_process_buffer_final_flush():
    buf = "Hello [[cmd:dance]]"
    remaining, emitted, cmds = process_buffer(buf, partial=False)
    assert remaining == ""
    assert len(cmds) == 1
    assert cmds[0].name == "dance"


def test_process_buffer_holds_partial_bracket():
    buf = "some text ["
    remaining, emitted, cmds = process_buffer(buf, partial=True)
    assert remaining == "["
    assert emitted == "some text "
    assert cmds == []
