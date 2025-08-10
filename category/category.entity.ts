import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number

  @Column('varchar', { nullable: false, length: 255 })
  name: string

  @Column('varchar', { nullable: false, length: 255 })
  description: string
}
