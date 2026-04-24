# 产品规则

## 项目规则

这里的“项目”指 ../../backend/src/app/models/project.py

### status的变化规则

active -> inactive -> archived

inactive -> active

### 项目创建规则

创建项目时必须指定一个组织，这里的组织指 ../../backend/src/app/models/org_unit.py。org_project表保存了组织和project的关系。
