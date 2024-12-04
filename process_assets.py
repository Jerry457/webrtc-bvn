# 遍历文件夹

import os

file_map = {
    "fz": {
        "sasuke": "Sasuke",
        "sakura": "Sakura",
    },
    "fighter": {
        "renji": "Renji",
        "byakuya": "Byakuya",
        "kakashi": "Kakashi",
        "sasuke1": "Sasuke1",
    },
}

for _, bvn_dirs, _ in os.walk("./public"):
    for bvn_dir in bvn_dirs:
        for root, dirs, files in os.walk(f"./public/{bvn_dir}"):
            for dir in dirs:
                if dir in file_map:
                    for _root, _, _files in os.walk(os.path.join(root, dir)):
                        for file in _files:
                            old_name = file.replace(".swf", "")
                            if old_name in file_map[dir]:
                                os.rename(
                                    os.path.join(_root, file),
                                    os.path.join(
                                        _root, file_map[dir][old_name] + ".swf"
                                    ),
                                )
                    break
            break
    break
