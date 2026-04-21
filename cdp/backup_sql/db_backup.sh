#!/bin/bash
# CDP 数据库备份脚本
# 用法: ./db_backup.sh [backup|list|restore <filename>]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/sql"
ENV_FILE="$SCRIPT_DIR/../backend/.env"

mkdir -p $BACKUP_DIR

# 从 .env 文件读取数据库配置
load_db_config() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "错误: 找不到配置文件 $ENV_FILE"
    exit 1
  fi

  # 读取各自分离的配置
  DB_USER=$(grep "^DB_USER=" "$ENV_FILE" | cut -d'"' -f2)
  DB_PASSWORD=$(grep "^DB_PASSWORD=" "$ENV_FILE" | cut -d'"' -f2)
  DB_HOST=$(grep "^DB_HOST=" "$ENV_FILE" | cut -d'"' -f2)
  DB_PORT=$(grep "^DB_PORT=" "$ENV_FILE" | cut -d'"' -f2)
  DB_NAME=$(grep "^DB_NAME=" "$ENV_FILE" | cut -d'"' -f2)

  if [[ -z "$DB_USER" || -z "$DB_PASSWORD" || -z "$DB_HOST" || -z "$DB_PORT" || -z "$DB_NAME" ]]; then
    echo "错误: 无法从 $ENV_FILE 解析数据库配置"
    exit 1
  fi
}

# 清理旧备份，只保留最多5个
cleanup_old_backups() {
  local backup_count=$(ls -1 "$BACKUP_DIR"/cdp_backup_*.sql 2>/dev/null | wc -l)
  if [[ $backup_count -gt 5 ]]; then
    local to_delete=$((backup_count - 5))
    echo "备份文件超过5个，删除最早 $to_delete 个..."

    # 按时间排序，删除最早的文件
    ls -1t "$BACKUP_DIR"/cdp_backup_*.sql | tail -n "$to_delete" | while read -r file; do
      echo "删除: $file"
      rm "$file"
    done
  fi
}

# 备份数据库
do_backup() {
  load_db_config

  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  BACKUP_FILE="$BACKUP_DIR/cdp_backup_${TIMESTAMP}.sql"

  echo "开始备份数据库 $DB_NAME 到 $BACKUP_FILE ..."

  echo mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"

  mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" >"$BACKUP_FILE"

  if [[ $? -eq 0 ]]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "备份成功: $BACKUP_FILE ($SIZE)"
    cleanup_old_backups
  else
    echo "备份失败"
    exit 1
  fi
}

# 列出所有备份
do_list() {
  echo "备份文件列表:"
  echo "────────────────────────────────────────────────────────"
  printf "%-50s %10s %s\n" "文件名" "大小" "修改时间"
  echo "────────────────────────────────────────────────────────"

  if [[ ! -d "$BACKUP_DIR" ]]; then
    echo "备份目录不存在: $BACKUP_DIR"
    exit 0
  fi

  for file in "$BACKUP_DIR"/*.sql; do
    if [[ -f "$file" ]]; then
      FILENAME=$(basename "$file")
      SIZE=$(du -h "$file" | cut -f1)
      MTIME=$(date -r "$file" +"%Y-%m-%d %H:%M:%S")
      printf "%-50s %10s %s\n" "$FILENAME" "$SIZE" "$MTIME"
    fi
  done
}

# 还原数据库
do_restore() {
  if [[ -z "$1" ]]; then
    echo "用法: $0 restore <filename>"
    exit 1
  fi

  BACKUP_FILE="$BACKUP_DIR/$1"

  if [[ ! -f "$BACKUP_FILE" ]]; then
    echo "错误: 备份文件不存在: $BACKUP_FILE"
    exit 1
  fi

  load_db_config

  echo "警告: 将从 $BACKUP_FILE 还原数据库 $DB_NAME"
  echo "此操作将覆盖现有数据，确定要继续吗？"
  read -p "请输入 'yes' 确认: " CONFIRM

  if [[ "$CONFIRM" != "yes" ]]; then
    echo "操作已取消"
    exit 0
  fi

  echo "开始还原数据库 ..."

  mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" <"$BACKUP_FILE"

  if [[ $? -eq 0 ]]; then
    echo "还原成功"
  else
    echo "还原失败"
    exit 1
  fi
}

# 主入口
case "$1" in
backup)
  do_backup
  ;;
list)
  do_list
  ;;
restore)
  do_restore "$2"
  ;;
*)
  echo "用法: $0 [backup|list|restore <filename>]"
  echo ""
  echo "命令:"
  echo "  backup              备份数据库"
  echo "  list                列出所有备份文件"
  echo "  restore <file>      从指定备份文件还原数据库"
  exit 1
  ;;
esac
