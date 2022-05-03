import os
import sys
import json
import glob
import re

if len(sys.argv) > 1:
    
    for fname in sys.argv[1:]:


        fpath = re.split('/', fname)

        ffolder = "/".join(fpath[:-1])
        if len(ffolder) == 0:
            ffolder = "."
        
        if fname[-3:] != '.py':
            print("Error: File not a python script")
            break

        if fname not in glob.glob(ffolder+"/*.py"):
            print("Error: File {} not found in {} with fname {}.".format(fpath[-1], ffolder, fname))
            print("File list:", glob.glob(ffolder+"/*.py"))
            break

        added_modules = None
        with open("./loaded-modules.json") as f:
            added_modules = json.load(f)


        if added_modules is not None:
            if fname not in added_modules:
                added_modules.append(fname)
                with open("./loaded-modules.json", "w") as f:
                    json.dump(added_modules, f)
            else:
                print("File already in the loaded modules.")
        else:
            print("Error: added_modules.json not found")
            break

else:

    print("Invalid Number of arguments.")