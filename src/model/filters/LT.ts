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

import { Record } from "../Record.js";
import { Filter } from "../interfaces/Filter.js";
import { BindValue } from "../../database/BindValue.js";


export class LT implements Filter
{
	private constraint$:any;
	private incl:boolean = false;
	private column$:string = null;
	private bindval$:string = null;

	public constructor(column:string, incl?:boolean)
	{
		this.incl = incl;
		this.column$ = column;
		this.bindval$ = column;
	}

	public clear() : void
	{
		this.constraint$ = null;
	}

	public getBindValueName() : string
	{
		return(this.bindval$);
	}

	public setBindValueName(name: string) : Filter
	{
		this.bindval$ = name;
		return(this);
	}

	public setConstraint(value:any) : Filter
	{
		this.constraint = value;
		return(this);
	}

	public get constraint() : any
	{
		return(this.constraint$);
	}

	public set constraint(value:any)
	{
		this.constraint$ = value;
	}

	public getBindValues(): BindValue[]
	{
		return([new BindValue(this.bindval$,this.constraint$)]);
	}

	public async evaluate(record:Record) : Promise<boolean>
	{
		if (this.column$ == null) return(false);
		if (this.constraint$ == null) return(false);

		let value:any = record.getValue(this.column$.toLowerCase());

		if (this.incl) return(value <= this.constraint$);
		return(value < this.constraint$);
	}

	public asSQL() : string
	{
		if (this.constraint$ == null)
			return("1 == 2");

		if (this.bindval$ == null)
			this.bindval$ = this.column$;

		let gt:string = this.incl ? "<=" : "<";
		let whch:string = this.column$ + " "+gt+" :"+this.bindval$;

		return(whch)
	}
}