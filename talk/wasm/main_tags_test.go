package main

import (
	"os"
	"strings"
	"testing"
)

func TestMainGoHasWasmBuildTags(t *testing.T) {
	src, err := os.ReadFile("main.go")
	if err != nil {
		t.Fatalf("read main.go: %v", err)
	}
	text := string(src)
	text = strings.ReplaceAll(text, "\r\n", "\n")
	if !strings.HasPrefix(text, "//go:build js && wasm\n// +build js,wasm\n\n") {
		t.Fatal("main.go must start with js/wasm build tags")
	}
}
