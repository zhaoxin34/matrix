"""Simulate 命令 - 用户行为模拟."""

from __future__ import annotations

from datetime import datetime

import typer
from rich.console import Console

from sati.database import load_users_from_db
from sati.simulator import PAGE_SUBTYPE_NAMES, STATE_NAMES, Simulator
from sati.user import User

sim_app = typer.Typer(name="simulate", help="运行用户行为模拟器")


def _load_users_from_db(limit: int | None = None) -> list[User]:
    """从数据库加载用户，加载失败时打印错误并退出.

    Args:
        limit: 可选，限制返回的用户数量。

    Returns:
        list[User]: User 对象列表。
    """
    console = Console()
    try:
        users = load_users_from_db()
        if limit is not None:
            users = users[:limit]
        return users
    except Exception as e:
        console.print(f"[bold red]✗ 从数据库加载用户失败: {e}[/bold red]")
        raise typer.Exit(1)


def _parse_duration(duration: str) -> int | None:
    """解析持续时间字符串。

    支持格式: 3m (3分钟), 2h (2小时), 1d (1天)

    Args:
        duration: 持续时间字符串，如 "3m", "2h", "1d"

    Returns:
        int: 秒数，如果格式错误返回 None
    """
    if not duration:
        return None

    unit = duration[-1].lower()
    try:
        value = int(duration[:-1])
    except ValueError:
        return None

    if unit == "m":
        return value * 60  # 分钟
    elif unit == "h":
        return value * 3600  # 小时
    elif unit == "d":
        return value * 86400  # 天
    return None


@sim_app.command("demo")
def simulate_demo(
    users: int = typer.Option(2, "--users", "-n", help="生成用户数量"),
    start_time: str | None = typer.Option(
        None, "--start-time", "-s", help="模拟开始时间，格式: 'YYYY-MM-DD HH:MM:SS'"
    ),
    duration: str = typer.Option(
        "3m", "--duration", "-d", help="模拟持续时间，格式: 数字+单位(m/h/d)"
    ),
) -> None:
    """运行用户行为模拟器（演示模式）.

    示例:
      sati simulate demo                  默认：2个用户，当前时间开始，持续3分钟
      sati simulate demo -n 5             模拟5个用户
      sati simulate demo -s '2026-03-01 12:00:00'  指定开始时间
      sati simulate demo -d 5m            持续5分钟
      sati simulate demo -d 2h            持续2小时
      sati simulate demo -d 1d            持续1天
    """
    console = Console()

    # 解析开始时间
    if start_time:
        try:
            start_dt = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            console.print("[bold red]✗ 开始时间格式错误，请使用 'YYYY-MM-DD HH:MM:SS' 格式[/bold red]")
            raise typer.Exit(1)
    else:
        start_dt = datetime.now()

    # 解析持续时间
    duration_seconds = _parse_duration(duration)
    if duration_seconds is None:
        console.print("[bold red]✗ 持续时间格式错误，请使用 数字+m/h/d，如 3m, 2h, 1d[/bold red]")
        raise typer.Exit(1)

    end_time = start_dt.timestamp() + duration_seconds

    console.print(f"[bold blue]Sati 模拟器启动 - {users} 个用户[/bold blue]")
    console.print(f"开始时间: {start_dt.strftime('%Y-%m-%d %H:%M:%S')}")
    console.print(f"持续时间: {duration} ({duration_seconds} 秒)")
    console.print(f"结束时间: {datetime.fromtimestamp(end_time).strftime('%Y-%m-%d %H:%M:%S')}")

    sim = Simulator(use_real_api=False)
    generated_users = sim.generator.generate_users(users)

    for user in generated_users:
        trajectory = _run_user_timed(sim, user, int(start_dt.timestamp()), int(end_time))
        _print_trajectory(console, user, trajectory)

    console.print("[bold green]✓ 模拟完成[/bold green]")


@sim_app.command("batch")
def simulate_batch(
    users: int = typer.Option(0, "--users", "-n", help="从数据库加载的用户数量，0表示全部"),
    start_time: str | None = typer.Option(
        None, "--start-time", "-s", help="模拟开始时间，格式: 'YYYY-MM-DD HH:MM:SS'"
    ),
    duration: str = typer.Option(
        "3m", "--duration", "-d", help="模拟持续时间，格式: 数字+单位(m/h/d)"
    ),
) -> None:
    """运行用户行为模拟器（数据库模式）.

    从数据库加载真实用户，配合 RealPageFeedback 进行模拟。

    示例:
      sati simulate batch                 加载全部用户，3分钟
      sati simulate batch -n 5            加载5个用户
      sati simulate batch -s '2026-03-01 12:00:00'  指定开始时间
      sati simulate batch -d 5m           持续5分钟
    """
    console = Console()

    # 解析开始时间
    if start_time:
        try:
            start_dt = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            console.print("[bold red]✗ 开始时间格式错误，请使用 'YYYY-MM-DD HH:MM:SS' 格式[/bold red]")
            raise typer.Exit(1)
    else:
        start_dt = datetime.now()

    # 解析持续时间
    duration_seconds = _parse_duration(duration)
    if duration_seconds is None:
        console.print("[bold red]✗ 持续时间格式错误，请使用 数字+m/h/d，如 3m, 2h, 1d[/bold red]")
        raise typer.Exit(1)

    end_time = start_dt.timestamp() + duration_seconds

    # 加载用户
    limit = users if users > 0 else None
    db_users = _load_users_from_db(limit)

    if not db_users:
        console.print("[bold red]✗ 数据库中没有用户，请先创建用户[/bold red]")
        raise typer.Exit(1)

    console.print(f"[bold blue]Sati 模拟器启动 - {len(db_users)} 个真实用户[/bold blue]")
    console.print(f"开始时间: {start_dt.strftime('%Y-%m-%d %H:%M:%S')}")
    console.print(f"持续时间: {duration} ({duration_seconds} 秒)")
    console.print(f"结束时间: {datetime.fromtimestamp(end_time).strftime('%Y-%m-%d %H:%M:%S')}")

    sim = Simulator(use_real_api=True)

    for user in db_users:
        trajectory = _run_user_timed(sim, user, int(start_dt.timestamp()), int(end_time))
        _print_trajectory(console, user, trajectory)

    console.print("[bold green]✓ 模拟完成[/bold green]")


@sim_app.command("run")
def simulate_run(
    duration: str = typer.Option(
        ..., "--duration", "-d", help="模拟持续时间，格式: 数字+单位(m/h/d)，必填"
    ),
) -> None:
    """运行实时用户行为模拟器（wall-clock 模式）.

    每 wall-clock 1 分钟对所有用户调用一次 step()，带统计输出。
    从数据库加载全部用户，配合 RealPageFeedback 进行模拟。

    示例:
      sati simulate run -d 5m            持续5分钟，每分钟输出统计
      sati simulate run -d 2h            持续2小时
    """
    import time

    console = Console()

    # 解析持续时间
    duration_seconds = _parse_duration(duration)
    if duration_seconds is None:
        console.print("[bold red]✗ 持续时间格式错误，请使用 数字+m/h/d，如 3m, 2h, 1d[/bold red]")
        raise typer.Exit(1)

    # 加载全部用户
    users = _load_users_from_db()

    if not users:
        console.print("[bold red]✗ 数据库中没有用户，请先创建用户[/bold red]")
        raise typer.Exit(1)

    console.print(f"[bold blue]Sati 实时模拟器启动 - {len(users)} 个真实用户[/bold blue]")
    console.print(f"持续时间: {duration} ({duration_seconds} 秒)")
    console.print("每分钟输出统计，按 Ctrl+C 退出\n")

    sim = Simulator(use_real_api=True)
    start_time = time.time()
    end_time = start_time + duration_seconds
    current_sim_time = int(start_time)

    # 动作计数
    action_counts: dict[str, int] = {}

    while time.time() < end_time:
        tick_start = time.time()
        active_count = 0
        exit_count = 0

        for user in users:
            if user.state.current_state == "exit":
                exit_count += 1
                continue

            next_state = sim.step(user, current_sim_time)
            active_count += 1

            # 统计动作
            if next_state:
                action_counts[next_state] = action_counts.get(next_state, 0) + 1

        # 打印统计
        now = datetime.now()
        console.print(f"[bold cyan]{now.strftime('%H:%M:%S')}[/bold cyan] | "
                      f"活跃: {active_count} | 退出: {exit_count} | 动作: {action_counts}")

        # 等待到下一个整分钟
        elapsed = time.time() - tick_start
        sleep_time = 60 - elapsed
        if sleep_time > 0 and time.time() < end_time:
            time.sleep(sleep_time)

        current_sim_time += 60

    console.print("[bold green]✓ 模拟完成[/bold green]")


def _run_user_timed(
    sim: Simulator,
    user: User,
    start_timestamp: int,
    end_timestamp: int,
) -> list[tuple[int, str, str, str | None]]:
    """运行用户模拟，按时间范围而非步数.

    Args:
        sim: 模拟器实例
        user: 用户对象
        start_timestamp: 开始时间戳（秒）
        end_timestamp: 结束时间戳（秒）

    Returns:
        list[tuple[int, str, str, str | None]]: 行为轨迹列表，
            每个元素为 (时间戳, 源状态, 目标状态, 页面子类型)
    """
    trajectory: list[tuple[int, str, str, str | None]] = []
    current_time = start_timestamp

    # 初始化第一页
    user.state.current_page_state = sim.page_feedback.get_page_state(user, user.state.current_state, "")

    while current_time < end_timestamp:
        from_state = user.state.current_state
        next_state = sim.step(user, current_time)

        if next_state is None:
            break

        page_subtype = user.state.current_page_state.page_subtype if user.state.current_page_state else None
        trajectory.append((current_time, from_state, next_state, page_subtype))

        if next_state == "exit":
            break

        current_time += 60  # 每步1分钟
        if current_time >= end_timestamp:
            break

    return trajectory


def _print_trajectory(
    console: Console,
    user: User,
    trajectory: list[tuple[int, str, str, str | None]],
) -> None:
    """打印用户行为轨迹.

    Args:
        console: Rich console for output
        user: 用户对象
        trajectory: 行为轨迹列表，每元素为 (时间戳, 源状态, 目标状态, 页面子类型)
    """
    profile = user.profile
    console.print(f"\n{'=' * 70}")
    console.print(f"用户ID: {profile.user_id[:8]}...")
    msg = f"职业: {profile.occupation_type}, 年龄: {profile.age}, 收入: {profile.income_monthly}"
    console.print(msg)
    console.print(f"{'=' * 70}")
    console.print(f"{'时间':<12} {'源状态':<8} {'目标状态':<8} {'页面':<12} {'说明'}")
    console.print("-" * 70)

    for ts, from_state, to_state, page_subtype in trajectory:
        dt = datetime.fromtimestamp(ts)
        to_name = STATE_NAMES.get(to_state, to_state)
        page_name = PAGE_SUBTYPE_NAMES.get(page_subtype, page_subtype) if page_subtype else "-"
        exit_marker = " <<< EXIT" if to_state == "exit" else ""
        msg = f"{dt.strftime('%H:%M:%S'):<12} {from_state:<8} {to_state:<8} {page_name:<12} {to_name}{exit_marker}"
        console.print(msg)

    console.print("-" * 70)
