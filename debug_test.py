#!/usr/bin/env python3
"""
调试测试脚本
"""

import sys
import json
import subprocess
from pathlib import Path

def test_with_file():
    """测试带文件的分析"""
    
    # 创建一个测试H5AD文件路径（即使文件不存在，也能测试到错误处理）
    test_file = "tmp/test.h5ad"
    
    script_path = str(Path("chat_scripts") / "agent_executor.py")
  