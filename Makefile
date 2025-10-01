.PHONY:

rm_vst:
	sudo rm -fr /Library/Audio/Plug-Ins/VST/RhapsodyExpansionTemplate.vst

install_vst:
	sudo cp -R /Users/a.ankip/reps/unkeep/hisetest/Binaries/Builds/MacOSX/build/Release/RhapsodyExpansionTemplate.vst /Library/Audio/Plug-Ins/VST/RhapsodyExpansionTemplate.vst

compile:
	/Users/a.ankip/reps/unkeep/hisetest/Binaries/batchCompileOSX

rm_bin:
	rm -fr /Users/a.ankip/reps/unkeep/hisetest/Binaries

fake_id_token:
	 echo "FakeToken" > "/Users/a.ankip/Library/Application Support/My Company/RhapsodyExpansionTemplate/license-manager.id"

rm_id_token:
	rm "/Users/a.ankip/Library/Application Support/My Company/RhapsodyExpansionTemplate/license-manager.id"