#!/usr/bin/env python3
"""
Setup script for the Communication Coach API
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    print("Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ All packages installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing packages: {e}")
        return False
    return True

def create_env_file():
    """Create .env file if it doesn't exist"""
    if not os.path.exists(".env"):
        print("Creating .env file...")
        with open(".env", "w") as f:
            f.write("# Add your Anthropic API key here\n")
            f.write("ANTHROPIC_API_KEY=your_api_key_here\n")
        print("✅ .env file created! Please add your Anthropic API key.")
    else:
        print("✅ .env file already exists")

def main():
    print("🚀 Setting up Communication Coach API...")
    
    if install_requirements():
        create_env_file()
        print("\n🎉 Setup complete!")
        print("\nNext steps:")
        print("1. Add your Anthropic API key to the .env file")
        print("2. Run the API with: uvicorn main:app --reload")
        print("3. Visit http://localhost:8000/docs for API documentation")
    else:
        print("❌ Setup failed. Please check the error messages above.")

if __name__ == "__main__":
    main()