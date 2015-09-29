#!/bin/bash

# Dependencies:
#	- wine
#	- nullsoft scriptable install system (NSIS)

end() {
	if [ $1 != 0 ]; then
		echo "Error installing development dependencies: wine, nullsoft scriptable install system (NSIS)"
	else
		echo "Successfully installed development dependencies: wine, nullsoft scriptable install system (NSIS)"
	fi
}

exit_() {
	echo "Exiting..."
    exit 0
}

# check/install deps on OSX (brew > [ wine, makensis ])
if [ "$(uname)" == "Darwin" ]; then

	echo "Installing development dependencies (wine, makensis)..."
    
	if hash brew 2>/dev/null ; then
	    echo "Brew is required to install the following dependencies: wine, makensis."
	    end 1
	else
	    brew install wine makensis
	    echo "Brew installed the following dependencies: wine, makensis."
	    end 0
	fi

# check/install deps on Linux (wine, nsis)
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then

	echo "Installing development dependencies (wine, nsis)..."

    if add-apt-repository ppa:ubuntu-wine/ppa -y && apt-get update && apt-get install wine nsis -y ; then
	    echo "Apt-get installed the following dependencies: wine, nsis."
	    end 0
	else
		end 1
	fi

# check/install deps on Windows (Cygwin) (nullsoft scriptable install system)
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ] || [ "$(expr substr $(uname -s) 1 9)" == "CYGWIN_NT" ]; then

	echo "Checking for development dependencies (nullsoft scriptable install system (NSIS))..."

	if hash makensis 2>/dev/null ; then
        echo "To use electron-builder to create installers for this software, please install the nullsoft scriptable install system (NSIS) at http://nsis.sourceforge.net/Download"
        echo "Note: The NSIS binaries (e.g. in C:\Program Files (x86)\NSIS\Bin) must be globally executable via your PATH environmental variable"
    	exit_
    else
    	echo "Found NSIS"
    	echo "All development dependencies are installed."
    	exit_
    fi

fi

exit_
