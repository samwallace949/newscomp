import os
import sys
import json
import glob
import re

#SCRIPT SETS THE SPECIFIED JSON FILE AS OFFLINE DATA IN ignored FOLDER

def main():
    if len(sys.argv) > 1:
        
        fname = sys.argv[1]

        fpath = re.split('/', fname)

        if len(fpath) > 1:
            print("File name must be local to the ignored subdirectory of this directory.")
            return
        
        if fname[-5:] != '.json':
            print("Error: File not JSON.")
            return

        if "./ignored/"+fname not in glob.glob("./ignored/*.json"):
            print("Error: File ./ignored/{} not found in ignored.".format(fname))
            print("File list:", glob.glob("./ignored/*.json"))
            return

        out = dict({})
        out['datafile'] = fname
        out['featurefile'] = "features-"+fname

        with open("./ignored/local-data-info.json", "w") as f:
            json.dump(out, f)
            print("App now pointing at data file", fname)

    else:

        print("Invalid Number of arguments.")

if __name__ == "__main__":
    main()
