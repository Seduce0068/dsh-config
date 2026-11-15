#!/usr/bin/env python3
"""Zed のパネルレイアウト（3ペイン: 左=Project / 右=Agent / 下=Terminal）を
~/.local/share/zed/db/0-stable/db.sqlite の workspaces テーブルに書き込み、
Zed 再起動時にレイアウトが復元されるようにする。

事前条件:
  - Zed が停止していること（稼働中は DB が WAL で書き戻される可能性がある）
  - 対象ワークスペースのパスが workspaces テーブルに既に存在すること
    （存在しない場合は Zed で一度開いてから実行）

使い方:
  python3 restore-zed-layout.py                    # default-workspace を対象
  python3 restore-zed-layout.py /path/to/project   # 任意のプロジェクト

復元内容:
  left_dock:   visible=1, active_panel="Project Panel"
  right_dock:  visible=1, active_panel="AgentPanel"
  bottom_dock: visible=1, active_panel="TerminalPanel"

  ※ パネル幅は Zed が scoped_kv_store の "dock_panel_size" に保存するが、
    存在しない場合は settings.json の default_width/default_height が使われるため、
    このスクリプトでは dock_visible/active_panel のみ設定する。

ロールバック:
  バックアップを ~/.local/share/zed/db/0-stable/db.sqlite.bak-<timestamp> に作成。
  元に戻す場合は、Zed を停止してから:
    cp ~/.local/share/zed/db/0-stable/db.sqlite.bak-* db.sqlite
"""
import os
import shutil
import sqlite3
import sys
import time

DB_PATH = os.path.expanduser("~/.local/share/zed/db/0-stable/db.sqlite")
DEFAULT_WORKSPACE = "/home/koppe/document/deepseek-harness/default-workspace"

# Zed 1.28 の panel persistent_name / panel_key
LAYOUT = {
    "left_dock_visible": 1,
    "left_dock_active_panel": "Project Panel",
    "right_dock_visible": 1,
    "right_dock_active_panel": "AgentPanel",
    "bottom_dock_visible": 1,
    "bottom_dock_active_panel": "TerminalPanel",
}


def check_zed_stopped():
    import subprocess
    r = subprocess.run(["pgrep", "-x", "zed-editor"], capture_output=True)
    if r.returncode == 0:
        print("警告: Zed が起動中です。停止してから実行してください:", file=sys.stderr)
        print("  pkill -x zed-editor; sleep 2", file=sys.stderr)
        sys.exit(1)


def backup_db():
    ts = time.strftime("%Y%m%d-%H%M%S")
    bak = f"{DB_PATH}.bak-{ts}"
    for suffix in ("", "-wal", "-shm"):
        src = DB_PATH + suffix
        dst = bak + suffix
        if os.path.exists(src):
            shutil.copy2(src, dst)
    print(f"バックアップ: {bak}")
    return bak


def restore_layout(workspace_path):
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    # 対象ワークスペースの行を特定（paths カラムの部分一致）
    cur.execute(
        "SELECT workspace_id, paths, left_dock_active_panel FROM workspaces WHERE paths LIKE ?",
        (f"%{workspace_path}%",),
    )
    rows = cur.fetchall()
    if not rows:
        print(f"エラー: ワークスペース '{workspace_path}' が DB に見つかりません。", file=sys.stderr)
        print("Zed で一度プロジェクトを開いてから再実行してください。", file=sys.stderr)
        con.close()
        sys.exit(1)

    updated = 0
    for wid, paths, _current in rows:
        set_clause = ", ".join(f"{k} = ?" for k in LAYOUT)
        values = list(LAYOUT.values()) + [wid]
        cur.execute(
            f"UPDATE workspaces SET {set_clause} WHERE workspace_id = ?",
            values,
        )
        print(f"  workspace_id={wid}, paths={paths} → {LAYOUT['left_dock_active_panel']} / {LAYOUT['right_dock_active_panel']} / {LAYOUT['bottom_dock_active_panel']}")
        updated += cur.rowcount

    con.commit()
    con.close()
    print(f"更新行数: {updated}")


def main():
    workspace_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_WORKSPACE
    print(f"対象ワークスペース: {workspace_path}")
    print(f"DB: {DB_PATH}")

    check_zed_stopped()
    backup_db()
    restore_layout(workspace_path)
    print("完了: Zed を起動すると3ペイン（左=Project / 右=Agent / 下=Terminal）が復元されます。")


if __name__ == "__main__":
    main()
