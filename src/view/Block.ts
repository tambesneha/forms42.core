/*
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 3 only, as
 * published by the Free Software Foundation.

 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 */

import { Row } from "./Row.js";
import { Form } from "./Form.js";
import { Field } from "./fields/Field.js";
import { Form as ModelForm } from '../model/Form.js';
import { Form as Interface } from '../public/Form.js';
import { Block as ModelBlock } from '../model/Block.js';


export class Block
{
	private curr:number = 0;
	private form:Form = null;
	private name$:string = null;
	private model$:ModelBlock = null;
	private rows:Map<number,Row> = new Map<number,Row>();

	constructor(form:Interface,name:string)
	{
		if (name == null) name = "";
		this.form = Form.getForm(form);
		this.name$ = name.toLowerCase();
		ModelBlock.create(Form.getForm(form),this);
	}

	public get name() : string
	{
		return(this.name$);
	}

	public setCurrentRow(row:number) : void
	{
		if (row == -1 || row == this.curr)
			return;

		this.curr = row;
		let current:Row = this.rows.get(-1);

		if (current != null)
		{
			this.rows.get(this.curr).getFields().forEach((fld) =>
			{current.distribute(fld,fld.getStringValue());});
		}
	}

	public addRow(row:Row) : void
	{
		this.rows.set(row.rownum,row);
	}

	public getRow(rownum:number) : Row
	{
		return(this.rows.get(rownum));
	}

	public linkModel() : void
	{
		this.model$ = ModelForm.getForm(this.form.parent).getBlock(this.name);
	}

	public finalize() : void
	{
		let rows:Row[] = [];

		this.rows.forEach((row) => {rows.push(row)});

		if (rows.length == 1)
			rows[0].rownum = 0;

		if (rows.length > 1)
		{
			let n:number = 0;
			rows = rows.sort((r1,r2) => {return(r1.rownum - r2.rownum)});

			for (let i = 0; i < rows.length; i++)
			{
				if (rows[i].rownum < 0)
					continue;

				rows[i].rownum = n++;
			}
		}

		this.rows.clear();
		rows.forEach((row) => {this.rows.set(row.rownum,row)});
	}

	public distribute(field:Field, value:string) : void
	{
		let r:number = field.row.rownum;

		if (r >= 0)	this.getRow(-1)?.distribute(field,value);
		else		this.getRow(this.curr)?.distribute(field,value);
	}
}
