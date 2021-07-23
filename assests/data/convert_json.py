import win32com.client as win32
import json
import os
#open word
wordapp=win32.gencache.EnsureDispatch("Word.Application")
wordapp.Visible=False
#lấy theo đường dẫn tương đối
docpath=os.path.join(os.path.dirname(__file__),'UDCNTT.docx')
print(docpath)
doc=wordapp.Documents.Open(docpath) #(r'C:\Users\hanb\OneDrive\IT\Programming\Web developer\html\Trac_nghiem_a2\assests\data\Nhch.doc')
#table chứa ngân hàng câu hỏi
tbl=doc.Tables(1)

no_rows=tbl.Rows.Count
no_columns=tbl.Columns.Count
print(no_rows,no_columns)
data=[]


for r_idx in range(2, no_rows+1):
    pos=[]
    tmp={
    'id':'',
    'question':'',
    'options':[],
    'answer':'',
    'qtype':''
    }
    for c_idx in range(1,no_columns+1):        
        cellTxt=tbl.Cell(r_idx,c_idx).Range.Text
        if c_idx<=3:                
            print("hàng:",r_idx,"cột:",c_idx, "giá trị: ",cellTxt)      
        if c_idx==1:
            tmp['id']=cellTxt.strip().replace("\r\x07","") #cell line terminator \r\x07
        elif c_idx==2:
            cellTxt=cellTxt.replace(chr(13),"").replace(chr(11),"").replace("\xa0"," ").replace("\x07","") #\xa0 is actually non-breaking space in Latin1 
            p1=cellTxt.find("A.")
            if p1<0:
                p1=cellTxt.find("A/")
            if p1<0:
                p1=cellTxt.find("A)")
            if p1>=0:
                pos.append(p1)

            p2=cellTxt.find("B.")
            if p2<0:
                p2=cellTxt.find("B/")
            if p2>=0:
                pos.append(p2)

            p3=cellTxt.find("C.")
            if p3<0:
                p3=cellTxt.find("C/")
            if p3>=0:
                pos.append(p3) 

            p4=cellTxt.find("D.")
            if p4<0:
                p4=cellTxt.find("D/")
            if p4>=0:
                pos.append(p4) 

            p5=cellTxt.find("E.")
            if p5<0:
                p4=cellTxt.find("E/")
            if p5>=0:
                pos.append(p5) 

            print("câu hỏi ",r_idx-1,"vị trí: ", pos)
            tmp['question']=cellTxt[:pos[0]]
            #tìm câu trả lời
            for i in range(0,len(pos)):     
                if i<len(pos)-1:   
                    opt=cellTxt[pos[i]:pos[i+1]]
                else:
                    opt=cellTxt[pos[i]:]
                tmp['options'].append(opt)
        elif c_idx==3:
            tmp['answer']=cellTxt.strip().replace("\r\x07","")
        elif c_idx==4:
            tmp['qtype']=cellTxt.strip().replace("\r\x07","")
    #print(tmp)
    data.append(tmp)

print(data)
#in ra file
datapath=os.path.join(os.path.dirname(__file__),'data.json')
with open(datapath, 'w', encoding='utf-8') as outfile:
    json.dump(data, outfile,ensure_ascii=False)

doc.Close()
wordapp.Application.Quit()
