package lib

import (
	"fmt"
	"os"
	"os/exec"
	"os/user"
)

// LoadAndDeploy - Loads the image and deploy to k8s
func LoadAndDeploy(filename string, tag string, module string, namespace string) {
	usr, err := user.Current()
	if err != nil {
		fmt.Println(err)
	}
	cmd := exec.Command("docker load < " + usr.HomeDir + "/temp-images/" + filename)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		fmt.Println(err)
	}
	cmd = exec.Command("kubectl set image deployment/" + module + " " + module + "=odp:" + module + "." + tag + " -n " + namespace + " --record=true")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		fmt.Println(err)
	}
}
