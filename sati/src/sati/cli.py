"""Sati CLI - 命令行工具."""

from __future__ import annotations

import logging
import sys

import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

from sati.commands import sim_app
from sati.config import LOG_FILE
from sati.database import clear_users, count_users, init_database, save_users
from sati.generator import UserGenerator

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

# 注册子命令
app.add_typer(sim_app)


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


def main() -> None:
    """CLI 入口函数."""
    app()


if __name__ == "__main__":
    main()
