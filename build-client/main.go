package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"os/user"
	"./lib"
)


func deploy(w http.ResponseWriter, req *http.Request) {
	fmt.Println("File Upload Endpoint Hit")
	usr, err := user.Current()
    if err != nil {
        fmt.Println(err)
	}
	
    // Parse our multipart form, 10 << 20 specifies a maximum
    // upload of 10 MB files.
    req.ParseMultipartForm(10 << 20)
    // FormFile returns the first file for the given key `myFile`
    // it also returns the FileHeader so we can get the Filename,
    // the Header and the size of the file
	file, handler, err := req.FormFile("file")
	tag := req.FormValue("tag")
	module := req.FormValue("module")
	namespace := req.FormValue("namespace")
    if err != nil {
        fmt.Println("Error Retrieving the File")
        fmt.Println(err)
        return
    }
    defer file.Close()
    fmt.Printf("Uploaded File: %+v\n", handler.Filename)
    fmt.Printf("File Size: %+v\n", handler.Size)
    fmt.Printf("MIME Header: %+v\n", handler.Header)

    // Create a temporary file within our temp-images directory that follows
	// a particular naming pattern
	bytes,err := ioutil.ReadAll(file)
	if err != nil {
        fmt.Println(err)
	}
	err = os.MkdirAll(usr.HomeDir+"/temp-images/", os.ModePerm)
	if err != nil {
        fmt.Println(err)
    }
    err = ioutil.WriteFile(usr.HomeDir+"/temp-images/"+handler.Filename,bytes,0644)
    if err != nil {
        fmt.Println(err)
	}
	go lib.LoadAndDeploy(handler.Filename,tag,module,namespace)

    fmt.Fprintf(w, "Successfully Uploaded File\n")
}

func main() {
    http.HandleFunc("/deploy", deploy)
	http.ListenAndServe(":8000", nil)
	fmt.Println("Server is up and running")
}
