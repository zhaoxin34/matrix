"""Sati CLI - 命令行工具."""

from __future__ import annotations

import logging
import sys
from datetime import datetime

import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

from sati.config import LOG_FILE
from sati.database import clear_users, count_users, init_database, save_users
from sati.generator import UserGenerator
from sati.page_feedback import FakePageFeedback
from sati.simulator import PAGE_SUBTYPE_NAMES, STATE_NAMES, Simulator
from sati.user import User

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout),
    ],
)

logger = logging.getLogger(__name__)

# 创建 Typer app 和 Rich console
app = typer.Typer(
    name="sati",
    help="Sati 用户行为模拟系统 CLI",
    add_completion=False,
)
console = Console()

# 创建 simulate 子命令组
simulate_app = typer.Typer()
app.add_typer(simulate_app, name="simulate", help="运行用户行为模拟器")


@app.command()
def init_db() -> None:
    """初始化数据库（创建 sati 数据库和 users 表）."""
    console.print("[bold blue]正在初始化数据库...[/bold blue]")

    try:
        init_database()
        console.print("[bold green]✓ 数据库初始化完成[/bold green]")
        console.print("  数据库: sati")
        console.print("  表: users")
    except Exception as e:
        console.print(f"[bold red]✗ 初始化失败: {e}[/bold red]")
        raise typer.Exit(1)


@app.command()
def create_user(
    count: int = typer.Option(..., "--count", "-n", help="要创建的用户数量", min=1),
    seed: int | None = typer.Option(None, "--seed", help="随机种子，用于复现生成结果"),
) -> None:
    """创建指定数量的用户并保存到数据库.

    示例:
      sati create-user -n 100          创建100个用户
      sati create-user -n 50 --seed 42 使用固定种子创建50个用户
    """
    console.print(f"[bold blue]开始创建 {count} 个用户...[/bold blue]")

    # 初始化数据库
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        progress.add_task("初始化数据库...", total=None)
        init_database()

    # 生成用户
    generator = UserGenerator(seed=seed)

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task(f"生成 {count} 个用户...", total=count)
        profiles = []
        for i in range(count):
            profiles.append(generator.generate_profile())
            progress.update(task, advance=1)

    # 保存到数据库
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        progress.add_task("保存到数据库...", total=None)
        success, fail = save_users(profiles)

    # 输出结果
    table = Table(title="创建结果", show_header=False)
    table.add_column(style="cyan")
    table.add_column(style="white")

    table.add_row("成功", f"[green]{success}[/green]")
    table.add_row("失败", f"[red]{fail}[/red]" if fail > 0 else "[green]0[/green]")

    console.print(table)

    # 显示数据库中的用户总数
    total = count_users()
    console.print(f"\n[bold]数据库中当前共有[/bold] [yellow]{total}[/yellow] [bold]个用户[/bold]")


@app.command()
def clear_user(
    force: bool = typer.Option(False, "--force", "-f", help="跳过确认直接删除"),
) -> None:
    """清除 users 和 user_info 表中的所有数据.

    示例:
      sati clear-user              交互式确认后删除
      sati clear-user --force     直接删除，不询问
    """
    total = count_users()

    if total == 0:
        console.print("[yellow]数据库中没有用户数据[/yellow]")
        return

    # 显示当前用户数量
    console.print(f"[bold]当前数据库中有[/bold] [red]{total}[/red] [bold]个用户[/bold]")

    # 如果没有 --force，需要确认
    if not force:
        confirm = typer.prompt(
            "确定要删除所有用户数据吗？此操作不可恢复。\n请输入: yes 确认",
            default="",
        )
        if confirm.lower() != "yes":
            console.print("[yellow]已取消删除操作[/yellow]")
            return

    # 执行删除
    console.print("[bold blue]正在删除用户数据...[/bold blue]")
    deleted = clear_users()

    if deleted > 0:
        console.print(f"[bold green]✓ 已删除 {deleted} 个用户[/bold green]")
    else:
        console.print("[bold red]✗ 删除失败[/bold red]")
        raise typer.Exit(1)


@simulate_app.command("demo")
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

    sim = Simulator(page_feedback=FakePageFeedback())
    generator = UserGenerator(seed=42)
    generated_users = generator.generate_users(users)

    for user in generated_users:
        trajectory = _run_user_timed(sim, user, int(start_dt.timestamp()), int(end_time))
        _print_trajectory(console, user, trajectory)

    console.print("[bold green]✓ 模拟完成[/bold green]")


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


def _run_user_timed(
    sim: Simulator,
    user: User,
    start_timestamp: int,
    end_timestamp: int,
) -> list[tuple[int, str, str | None]]:
    """运行用户模拟，按时间范围而非步数。

    Args:
        sim: 模拟器实例
        user: 用户对象
        start_timestamp: 开始时间戳（秒）
        end_timestamp: 结束时间戳（秒）

    Returns:
        list[tuple[int, str, str | None]]: 行为轨迹列表
    """
    trajectory: list[tuple[int, str, str | None]] = [(start_timestamp, user.state.current_state, None)]
    current_time = start_timestamp

    # 初始化第一页
    user.state.current_page_state = sim.page_feedback.get_page_state(user, user.state.current_state, "")

    while current_time < end_timestamp:
        next_state = sim.step(user, current_time)
        if next_state is None or next_state == "exit":
            break

        current_time += 60  # 每步1分钟
        if current_time >= end_timestamp:
            break

        page_subtype = user.state.current_page_state.page_subtype if user.state.current_page_state else None
        trajectory.append((current_time, next_state, page_subtype))

    return trajectory


def _print_trajectory(
    console: Console,
    user: User,
    trajectory: list[tuple[int, str, str | None]],
) -> None:
    """打印用户行为轨迹."""
    profile = user.profile
    console.print(f"\n{'=' * 60}")
    console.print(f"用户ID: {profile.user_id[:8]}...")
    msg = f"职业: {profile.occupation_type}, 年龄: {profile.age}, 收入: {profile.income_monthly}"
    console.print(msg)
    console.print(f"{'=' * 60}")
    console.print(f"{'时间':<12} {'状态':<8} {'页面':<12} {'说明'}")
    console.print("-" * 60)

    for ts, state, page_subtype in trajectory:
        dt = datetime.fromtimestamp(ts)
        state_name = STATE_NAMES.get(state, state)
        page_name = PAGE_SUBTYPE_NAMES.get(page_subtype, page_subtype) if page_subtype else "-"
        console.print(f"{dt.strftime('%H:%M:%S'):<12} {state:<8} {page_name:<12} {state_name}")

    console.print("-" * 60)


def main() -> None:
    """CLI 入口函数."""
    app()


if __name__ == "__main__":
    main()
