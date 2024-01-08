function getSampleJson(data) {
	return {
		"data": [
					{//Project
						"data": {
							"title": "Project",
							"attr" : { "id" : "project"},
							"icon": "folder"	// icon class added to the <ins> node
						},
						"metadata": { id: 21 },
						"state": "open jstree-undetermined",
						"children": [{
										"data": { "title": "Tools", "attr" : {"id" : "tools"}},
										"metadata": { id: 19 }
									},
									{
										"data": { "title": "Charts", "attr" : {"id" : "charts"}},
										"metadata": { id: 18 }
									}]
					},
					{//Enterprise Planning
						"data": {
							"title": "Enterprise Planning",
							"id" : "ep",
							"icon": "folder"	// icon class added to the <ins> node
						},
						"metadata": { id: 22 },
						"children": [{//Finance
							"data": { "title": "Finance", "attr" : {"id" : "finance"}},
							"metadata": { id: 17 }
						},
									{//Manufacturing
										"data": { "title": "Manufacturing", "attr" : {"id" : "manufacturing"}},
										"metadata": { id: 16 }
									}]
					},
					{//Order Management
						"data": {
							"title": "Order Management",
							"attr" : {"id" : "orderManagement"},
							"icon": "folder"	// icon class added to the <ins> node
						},
						"state": "open",
						"metadata": { id: 23 },
						"children": [{//Pricing
										"data": {
											"title": "Pricing",
											"attr" : {"id" : "pricing"},
											"icon": "folder"	// icon class added to the <ins> node
										},
										"metadata": { id: 24 },
										"state": "open",
										"children": [
											 {//Relationship Management Dashboard
												"data": { "title": "Relationship Management Dashboard", "attr" : {"id" : "relationshiManagementDashboard"}},
												"metadata": { id: 30 }
											 },
											 {//Sales Master Data
												"data": { "title": "Sales Master Data", "attr" : {"id" : "salesMasterData" , "class" :"softDeleted"}},
												"metadata": { id: 31 }
											 },
											 {//Sales Orders"
												"data": { "title": "Sales Orders", "attr" : {"id" : "salesOrders"}},
												"metadata": { id: 32 }
											 }
										]
									 },
									 {//Sales
										"data": { "title": "Sales", "attr" : {"id" : "sa"}},
										"metadata": { id: 25 }
									 }]
					},
					{//Various Icons
						"data": {
							"title": "Various Icons",
							"attr" : {"id" : "vi"},
							"icon": "folder"	// icon class added to the <ins> node
						},
						"metadata": { id: 22 },
						"children": [
									{
										"data": {
											"title": "No Icon",
											"attr" : {"id" : "ni"},
											"icon": "none"
										},
										"metadata": { id: 29 }
									},
									{
										"data": {
											"title": "Excel",
											"attr" : {"id" : "excel"},
											"icon": "excel"	// icon class added to the <ins> node
										},
										"metadata": { id: 29 }
									},
									{
										"data": {
											"title": "Erp",
											"attr" : {"id" : "erp"},
											"icon": "erp"	// icon class added to the <ins> node
										},
										"metadata": { id: 29 }
									},
									{
										"data": {
											"title": "Images",
											"attr" : {"id" : "imgs"},
											"icon": "images"	// icon class added to the <ins> node
										},
										"metadata": { id: 30 }
									},
									{
										"data": {
											"title": "Bullet",
											"attr" : {"id" : "bullet"},
											"icon": "bullet"	// icon class added to the <ins> node
										},
										"metadata": { id: 31 }
									},
									{
										"data": {
											"title": "Other Doc",
											"attr" : {"id" : "otherDoc"},
											"icon": "otherDoc"	// icon class added to the <ins> node
										},
										"metadata": { id: 32 }
									},
									{
										"data": {
											"title": "Page",
											"attr" : {"id" : "page"},
											"icon": "page"	// icon class added to the <ins> node
										},
										"metadata": { id: 33 }
									},
									{
										"data": {
											"title": "PDF",
											"attr" : {"id" : "pdf"},
											"icon": "pdf"	// icon class added to the <ins> node
										},
										"metadata": { id: 34 }
									},
									{
										"data": {
											"title": "powerpoint",
											"attr" : {"id" : "powerpoint"},
											"icon": "powerpoint"	// icon class added to the <ins> node
										},
										"metadata": { id: 35 }
									},
									{
										"data": {
											"title": "System Command",
											"attr" : {"id" : "systemCommand"},
											"icon": "systemCommand"	// icon class added to the <ins> node
										},
										"metadata": { id: 35 }
									},
									{
										"data": {
											"title": "Trash",
											"attr" : {"id" : "trash"},
											"icon": "trash"	// icon class added to the <ins> node
										},
										"metadata": { id: 36 }
									},
									{
										"data": {
											"title": "text",
											"attr" : {"id" : "text"},
											"icon": "text"	// icon class added to the <ins> node
										},
										"metadata": { id: 37 }
									},
									{
										"data": {
											"title": "video",
											"attr" : {"id" : "video"},
											"icon": "video"	// icon class added to the <ins> node
										},
										"metadata": { id: 38 }
									},
									{
										"data": {
											"title": "Word",
											"attr" : {"id" : "word"},
											"icon": "word"	// icon class added to the <ins> node
										},
										"metadata": { id: 39 }
									},
									{
										"data": {
											"title": "Web Page",
											"attr" : {"id" : "webPage"},
											"icon": "webPage"	// icon class added to the <ins> node
										},
										"metadata": { id: 39 }
									},
									 {
										 "data": {
											 "title": "Entity",
											 "attr" : {"id" : "entity"},
											 "icon": "entity"	// icon class added to the <ins> node
										 },
										 "metadata": { id: 40 }
									 },
									{
										"data": {
											"title": "Error ",
											"attr" : {"id" : "error"},
											"icon": "error"	// icon class added to the <ins> node
										},
										"metadata": { id: 41 }
									},
									{
										"data": {
											"title": "Warning ",
											"attr" : {"id" : "warning"},
											"icon": "warning"	// icon class added to the <ins> node
										},
										"metadata": { id: 42 }
									},
									{
										"data": {
											"title": "Checked ",
											"attr" : {"id" : "checked"},
											"icon": "checked"	// icon class added to the <ins> node
										},
										"metadata": { id: 43 }
									},
									{
										"data": {
											"title": "Folder ",
											"attr" : {"id" : "folder"},
											"icon": "folder"	// icon class added to the <ins> node
										},
										"metadata": { id: 44 }
									}]
					}
				 ]
			};
}

function getSampleJson2(data) {
	return {
		"data": [
					{   "data": {
							"title": "Additional 1",
							"attr" : { "id" : "additional1"}
						}
					},
					{   "data": {
							"title": "Additional 2",
							"attr" : { "id" : "additional2"}
						}
					},
					{   "data": {
							"title": "Additional 3",
							"id" : "ep",
							"attr" : { "id" : "additional3"}
						}
					}
				 ]
			};
}

