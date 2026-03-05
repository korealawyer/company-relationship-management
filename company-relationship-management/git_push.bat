cd c:\projects\franchise-consulting
git config user.email "korealawyer@gmail.com"
git config user.name "korealawyer"
git add .
git commit -m "Initial commit: IBS Law Firm Franchise Platform"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/korealawyer/company-relationship-management.git
git push -u origin main
