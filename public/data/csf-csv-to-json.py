import os, sys
import csv, json
import re

# Grab the file name of the data to be converted, or use the default
origFile = "2018-04-16_framework_v1.1_core1.csv"
destFile = "csf-1.1.json"
if len(sys.argv) > 1:
    origFile = sys.argv[1]
if len(sys.argv) > 2:
    destFile = sys.argv[2]

def parse_details(dataString):
    dataObj = {"name":"", "abbrev":"", "desc":""}
    openParenInd = dataString.find('(')
    closeParenInd = dataString.find(')')
    colonInd = dataString.find(": ")
    if openParenInd > 0 and colonInd == -1: # If open paren found and not the first character
        dataObj["name"] = dataString[0:openParenInd-1]
        if closeParenInd > -1:
            dataObj["abbrev"] = dataString[openParenInd+1:closeParenInd]
        # end if close paren was found
    # end if open paren found and no colon found
    elif openParenInd > 0 and colonInd > openParenInd: # If open paren found and not the first character
        dataObj["name"] = dataString[0:openParenInd-1]
        if closeParenInd > -1:
            dataObj["abbrev"] = dataString[openParenInd+1:closeParenInd]
            if closeParenInd < len(dataString) and colonInd > -1:
                dataObj["desc"] = dataString[colonInd+2:]
            # end if close paren is not last character
        # end if close paren was found
    # end if open paren found and no colon found
    elif colonInd > -1:
        dataObj["name"] = dataString[0:colonInd]
        dataObj["desc"] = dataString[colonInd+2:]
    # end if colon is found, but not opening paren
    
    #print("data obj: ", dataObj)
    return dataObj
# end parse_details

# The framework. A function has categories. A category has subcategories. A subcategory has informative references(?).
csf = {"funcs":{}}
# Variables to keep track of the current items.
curFunc= None
curCat = None
curSubcat = None
curRef = None

if os.path.exists(origFile):
    print("Reading file: ", origFile)
    with open(origFile, encoding='utf-8-sig') as csvFile:
        csvReader = csv.DictReader(csvFile)
        for row in csvReader:
            # Check for new values
            # Function
            funcAbbrev = ""
            if row["Function"]:
                funcDetails = parse_details(row["Function"])
                curFunc = funcDetails["name"]
                funcAbbrev = funcDetails["abbrev"]
            
            # Category
            catAbbrev = ""
            catDesc = ""
            if row["Category"]:
                catDetails = parse_details(row["Category"])
                curCat = catDetails["name"]
                catAbbrev = catDetails["abbrev"]
                catDesc = catDetails["desc"]

            # Subcategory
            subCatDesc = ""
            if row["Subcategory"]:
                subCatDetails = parse_details(row["Subcategory"])
                curSubcat = subCatDetails["name"]
                subCatDesc = subCatDetails["desc"]
            
            # Informative References
            curRef = row["Informative References"]
            # Remove unicode characters from the informative references (the bullets that are in at least version 1.1)
            curRef = re.sub(r'[^\x00-\x7f]',r'',curRef).strip()

            # If the function does not exist, add it.
            if curFunc not in csf["funcs"]:
                csf["funcs"][curFunc] = {"abbrev": funcAbbrev, "cats":{}}

            # If the category does not exist, add it.
            if curCat not in csf["funcs"][curFunc]["cats"]:
                csf["funcs"][curFunc]["cats"][curCat] = {"abbrev":catAbbrev, "desc":catDesc, "subcats": {}}
            
            # If the subcategory does not exist, add it.
            if curSubcat not in csf["funcs"][curFunc]["cats"][curCat]["subcats"]:
                csf["funcs"][curFunc]["cats"][curCat]["subcats"][curSubcat] = {"desc":subCatDesc, "refs":[]}
            
            if curRef:
                csf["funcs"][curFunc]["cats"][curCat]["subcats"][curSubcat]["refs"].append(curRef)
        # end for rows
    # end file open
    with open(destFile, 'w') as outputJson:
        outputJson.write(json.dumps(csf, indent=4))
else:
    print("CSV file does not exist: ", origFile)